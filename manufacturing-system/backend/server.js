const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const authRoutes = require('./src/routes/authRoutes');
const machineRoutes = require('./src/routes/machineRoutes');
const productionRoutes = require('./src/routes/productionRoutes');
const downtimeRoutes = require('./src/routes/downtimeRoutes');
const profitLossRoutes = require('./src/routes/profitLossRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const pool = require('./src/config/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/downtime', downtimeRoutes);
app.use('/api/profit-loss', profitLossRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Manufacturing System API is running!',
        version: '1.0.0',
        status: 'OK'
    });
});

// Debug endpoint - direct database update
app.put('/api/debug/update-machine/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        console.log('Debug update - Machine ID:', id, 'Status:', status);
        
        const result = await pool.query(
            'UPDATE machines SET status = $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        res.json({ success: true, machine: result.rows[0] });
    } catch (error) {
        console.error('Debug update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Simple update endpoint (no auth)
app.put('/api/simple-update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        console.log('Simple update - Machine:', id, 'Status:', status);
        
        const result = await pool.query(
            'UPDATE machines SET status = $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        res.json({ success: true, machine: result.rows[0] });
    } catch (error) {
        console.error('Simple update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Scheduled job to reset machines at midnight IST (India Standard Time)
cron.schedule('30 18 * * *', async () => {
    console.log('Running scheduled machine reset for new day (IST midnight)...');
    try {
        await pool.query('SELECT check_and_reset_new_day()');
        console.log('Scheduled machine reset completed successfully');
        
        io.emit('machines_reset', { 
            message: 'All machines have been reset for the new day',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Scheduled machine reset failed:', error);
    }
}, {
    timezone: "Asia/Kolkata"
});

// Also run on server startup to catch any missed resets
setTimeout(async () => {
    console.log('Checking for missed day reset on startup...');
    try {
        await pool.query('SELECT check_and_reset_new_day()');
        console.log('Startup reset check completed');
    } catch (error) {
        console.error('Startup reset check failed:', error);
    }
}, 5000);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: err.message 
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Manufacturing System API running on http://localhost:${PORT}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
    console.log(`   GET  http://localhost:${PORT}/api/machines`);
    console.log(`   GET  http://localhost:${PORT}/api/machines/stats`);
    console.log(`   POST http://localhost:${PORT}/api/machines/reset`);
    console.log(`   GET  http://localhost:${PORT}/api/production/today`);
    console.log(`   GET  http://localhost:${PORT}/api/downtime/open`);
    console.log(`   GET  http://localhost:${PORT}/api/settings`);
    console.log(`   PUT  http://localhost:${PORT}/api/settings`);
    console.log(`   GET  http://localhost:${PORT}/api/test`);
    console.log(`\n⏰ Scheduled reset: Daily at 00:00 IST (Indian Standard Time)`);
    console.log(`💡 Demo Login: owner@factory.com / temp123\n`);
});
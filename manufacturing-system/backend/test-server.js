const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as server_time, current_database() as database_name');
        res.json({ 
            success: true, 
            message: 'Database connected successfully!',
            server_time: result.rows[0].server_time,
            database: result.rows[0].database_name
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get all machines
app.get('/api/machines', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM machines ORDER BY machine_code');
        res.json({ 
            success: true, 
            count: result.rows.length,
            machines: result.rows 
        });
    } catch (error) {
        console.error('Error fetching machines:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get machine stats
app.get('/api/machines/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'running' THEN 1 END) as running,
                COUNT(CASE WHEN status = 'stopped' THEN 1 END) as stopped,
                COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
            FROM machines
        `);
        res.json({ success: true, stats: result.rows[0] });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY name');
        res.json({ success: true, products: result.rows });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, role, shift FROM users ORDER BY id');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Test server running on http://localhost:${PORT}`);
    console.log('\n📋 Available endpoints:');
    console.log(`  GET  http://localhost:${PORT}/api/test`);
    console.log(`  GET  http://localhost:${PORT}/api/test-db`);
    console.log(`  GET  http://localhost:${PORT}/api/machines`);
    console.log(`  GET  http://localhost:${PORT}/api/machines/stats`);
    console.log(`  GET  http://localhost:${PORT}/api/products`);
    console.log(`  GET  http://localhost:${PORT}/api/users`);
    console.log('\nPress Ctrl+C to stop\n');
});
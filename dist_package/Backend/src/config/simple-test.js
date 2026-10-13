const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Simple login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Simple query without password check first
        const result = await pool.query(
            'SELECT id, email, name, role FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        
        // For now, accept any password (just for testing)
        res.json({
            success: true,
            message: 'Login successful',
            user: user
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get machines endpoint
app.get('/api/machines', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM machines ORDER BY machine_code');
        res.json({ success: true, machines: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get users endpoint
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, role, shift FROM users');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Simple server running on http://localhost:${PORT}`);
    console.log('\n📋 Test endpoints:');
    console.log(`  POST http://localhost:${PORT}/api/login`);
    console.log(`  GET  http://localhost:${PORT}/api/machines`);
    console.log(`  GET  http://localhost:${PORT}/api/users`);
    console.log('\nDemo login: owner@factory.com / any password\n');
});
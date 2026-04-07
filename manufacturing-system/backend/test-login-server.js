const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.post('/api/login', async (req, res) => {
    try {
        console.log('\n=== Simple Login Test ===');
        const { email, password } = req.body;
        
        console.log('Email:', email);
        console.log('Password:', password);
        
        // Get user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            console.log('User not found');
            return res.status(401).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        console.log('User found:', user.email);
        
        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValid);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Return success
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Test server is running' });
});

const PORT = 5003;
app.listen(PORT, () => {
    console.log(`\n🔓 Simple Login Test Server running on http://localhost:${PORT}`);
    console.log(`\nTest with:`);
    console.log(`curl -X POST http://localhost:${PORT}/api/login -H "Content-Type: application/json" -d "{\"email\":\"owner@factory.com\",\"password\":\"temp123\"}"\n`);
});
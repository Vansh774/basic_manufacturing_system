const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testLogin() {
    try {
        console.log('Testing login functionality...\n');
        
        // Test user credentials
        const email = 'owner@factory.com';
        const plainPassword = 'temp123';
        
        // Get user from database
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            console.log('❌ User not found');
            return;
        }
        
        const user = result.rows[0];
        console.log('✅ User found:', user.email);
        console.log('Password hash:', user.password.substring(0, 30) + '...');
        
        // Test bcrypt compare
        const isValid = await bcrypt.compare(plainPassword, user.password);
        console.log('\n🔐 Password verification test:');
        console.log('   Plain password:', plainPassword);
        console.log('   Hash in DB:', user.password.substring(0, 30) + '...');
        console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');
        
        if (isValid) {
            console.log('\n🎉 Password works! Login should succeed.');
        } else {
            console.log('\n⚠️  Password doesn\'t match. Let\'s update it...');
            
            // Update with new hash
            const newHash = await bcrypt.hash(plainPassword, 10);
            await pool.query('UPDATE users SET password = $1 WHERE email = $2', [newHash, email]);
            console.log('✅ Password updated for', email);
            
            // Test again
            const isValid2 = await bcrypt.compare(plainPassword, newHash);
            console.log('   New verification result:', isValid2 ? '✅ VALID' : '❌ INVALID');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testLogin();
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

const hashAndUpdatePasswords = async () => {
    try {
        // First, check if users exist
        const usersResult = await pool.query('SELECT id, email, password FROM users');
        
        if (usersResult.rows.length === 0) {
            console.log('No users found. Please insert users first.');
            process.exit(1);
        }
        
        console.log(`Found ${usersResult.rows.length} users. Updating passwords...\n`);
        
        for (const user of usersResult.rows) {
            // Check if password is already hashed (bcrypt hashes start with $2b$)
            if (user.password && !user.password.startsWith('$2b$')) {
                const hashedPassword = await bcrypt.hash('temp123', 10);
                const query = 'UPDATE users SET password = $1 WHERE id = $2';
                await pool.query(query, [hashedPassword, user.id]);
                console.log(`✓ Password updated for ${user.email}`);
            } else {
                console.log(`- Password already hashed for ${user.email}`);
            }
        }
        
        console.log('\n✅ All passwords updated successfully!');
        console.log('\nDemo Credentials:');
        console.log('Owner: owner@factory.com / temp123');
        console.log('Manager: manager@factory.com / temp123');
        console.log('Operator: operator1@factory.com / temp123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating passwords:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

hashAndUpdatePasswords();
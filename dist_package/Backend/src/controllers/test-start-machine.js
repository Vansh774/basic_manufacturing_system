const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testStartMachine() {
    try {
        console.log('Testing machine start functionality...\n');
        
        // First, check machine M1 status
        let machine = await pool.query(`
            SELECT id, machine_code, name, status, current_downtime_reason, downtime_start_time 
            FROM machines 
            WHERE machine_code = 'M1'
        `);
        
        if (machine.rows.length === 0) {
            console.log('Machine M1 not found!');
            process.exit(1);
        }
        
        console.log('Before starting M1:');
        console.log(`Status: ${machine.rows[0].status}`);
        console.log(`Downtime Reason: ${machine.rows[0].current_downtime_reason || 'None'}`);
        console.log(`Downtime Start: ${machine.rows[0].downtime_start_time || 'None'}`);
        
        // Start the machine
        await pool.query(`
            UPDATE machines 
            SET status = 'running',
                current_downtime_reason = NULL,
                downtime_start_time = NULL,
                last_updated = CURRENT_TIMESTAMP
            WHERE machine_code = 'M1'
        `);
        
        // Check status after
        machine = await pool.query(`
            SELECT id, machine_code, name, status, current_downtime_reason, downtime_start_time 
            FROM machines 
            WHERE machine_code = 'M1'
        `);
        
        console.log('\nAfter starting M1:');
        console.log(`Status: ${machine.rows[0].status}`);
        console.log(`Downtime Reason: ${machine.rows[0].current_downtime_reason || 'None'}`);
        console.log(`Downtime Start: ${machine.rows[0].downtime_start_time || 'None'}`);
        
        console.log('\n✅ Machine start successful!');
        
        // Reset back to stopped for testing
        await pool.query(`
            UPDATE machines 
            SET status = 'stopped',
                current_downtime_reason = NULL,
                downtime_start_time = NULL,
                last_updated = CURRENT_TIMESTAMP
            WHERE machine_code = 'M1'
        `);
        
        console.log('\nMachine reset back to stopped for next test.');
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testStartMachine();
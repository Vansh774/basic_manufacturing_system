const pool = require('./src/config/db');

async function testMachineStatus() {
    try {
        // Check machines that are stopped
        const machines = await pool.query(`
            SELECT id, machine_code, name, status, 
                   current_downtime_reason, downtime_start_time, 
                   current_operator_id, current_product
            FROM machines 
            WHERE machine_code IN ('M1', 'M10')
        `);
        
        console.log('Machine status after reset:');
        machines.rows.forEach(m => {
            console.log(`${m.machine_code} - ${m.name}:`);
            console.log(`  Status: ${m.status}`);
            console.log(`  Downtime Reason: ${m.current_downtime_reason || 'None'}`);
            console.log(`  Downtime Start: ${m.downtime_start_time || 'None'}`);
            console.log(`  Operator: ${m.current_operator_id || 'None'}`);
            console.log(`  Product: ${m.current_product || 'None'}`);
            console.log('---');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testMachineStatus();
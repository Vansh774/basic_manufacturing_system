const pool = require('./src/config/db');

async function debugTest() {
    try {
        console.log('Testing database connection...');
        
        // Test simple query
        const result = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('✅ Database connected!');
        console.log(`📊 Users count: ${result.rows[0].count}`);
        
        // Test machines
        const machines = await pool.query('SELECT COUNT(*) as count FROM machines');
        console.log(`📊 Machines count: ${machines.rows[0].count}`);
        
        // Test User model
        const User = require('./src/models/User');
        const users = await User.findAll();
        console.log(`✅ User.findAll works! Found ${users.length} users`);
        
        // Test Machine model
        const Machine = require('./src/models/Machine');
        const allMachines = await Machine.findAll();
        console.log(`✅ Machine.findAll works! Found ${allMachines.length} machines`);
        
        const stats = await Machine.getStats();
        console.log(`✅ Machine stats:`, stats);
        
        // Test Production model
        const ProductionEntry = require('./src/models/ProductionEntry');
        const todayTotal = await ProductionEntry.getTodayTotal();
        console.log(`✅ Today's production: ${todayTotal} units`);
        
        // Test Downtime model
        const DowntimeEntry = require('./src/models/DowntimeEntry');
        const openDowntime = await DowntimeEntry.findOpen();
        console.log(`✅ Open downtime: ${openDowntime.length} issues`);
        
        console.log('\n🎉 All tests passed!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

debugTest();
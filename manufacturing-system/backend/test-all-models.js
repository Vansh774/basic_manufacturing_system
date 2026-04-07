console.log('Testing all models...\n');

async function testModels() {
    try {
        const User = require('./src/models/User');
        const Machine = require('./src/models/Machine');
        const ProductionEntry = require('./src/models/ProductionEntry');
        const DowntimeEntry = require('./src/models/DowntimeEntry');
        
        console.log('✅ All models loaded successfully');
        console.log('User.findByEmail exists:', typeof User.findByEmail === 'function');
        console.log('Machine.findAll exists:', typeof Machine.findAll === 'function');
        console.log('ProductionEntry.getTodayTotal exists:', typeof ProductionEntry.getTodayTotal === 'function');
        console.log('DowntimeEntry.findOpen exists:', typeof DowntimeEntry.findOpen === 'function');
        
        // Test database queries
        const users = await User.findAll();
        console.log(`\n📊 Found ${users.length} users`);
        
        const machines = await Machine.findAll();
        console.log(`📊 Found ${machines.length} machines`);
        
        const stats = await Machine.getStats();
        console.log(`📊 Machine Stats:`, stats);
        
        const todayProduction = await ProductionEntry.getTodayTotal();
        console.log(`📊 Today's Production: ${todayProduction} units`);
        
        const openDowntime = await DowntimeEntry.findOpen();
        console.log(`📊 Open Downtime: ${openDowntime.length} issues`);
        
        console.log('\n✅ All models working correctly!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testModels();
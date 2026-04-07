const User = require('./src/models/User');
const Machine = require('./src/models/Machine');
const ProductionEntry = require('./src/models/ProductionEntry');
const DowntimeEntry = require('./src/models/DowntimeEntry');

const testModels = async () => {
    try {
        console.log('Testing models...\n');
        
        // Test User model
        const users = await User.findAll();
        console.log(`✅ Users: ${users.length} users found`);
        
        // Test Machine model
        const machines = await Machine.findAll();
        console.log(`✅ Machines: ${machines.length} machines found`);
        
        const stats = await Machine.getStats();
        console.log(`✅ Machine Stats: Running=${stats.running}, Stopped=${stats.stopped}, Maintenance=${stats.maintenance}`);
        
        // Test Production model
        const todayTotal = await ProductionEntry.getTodayTotal();
        console.log(`✅ Today's Production: ${todayTotal} units`);
        
        // Test Downtime model
        const openDowntime = await DowntimeEntry.findOpen();
        console.log(`✅ Open Downtime: ${openDowntime.length} issues`);
        
        console.log('\n✅ All models working correctly!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error testing models:', error.message);
        process.exit(1);
    }
};

testModels();
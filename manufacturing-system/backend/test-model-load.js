console.log('Testing model loading...\n');

try {
    const User = require('./src/models/User');
    console.log('✅ User model loaded successfully');
    console.log('User.findByEmail exists:', typeof User.findByEmail === 'function');
    console.log('User.findById exists:', typeof User.findById === 'function');
    console.log('User.findAll exists:', typeof User.findAll === 'function');
} catch (error) {
    console.error('❌ Error loading User model:', error.message);
}

try {
    const Machine = require('./src/models/Machine');
    console.log('✅ Machine model loaded successfully');
} catch (error) {
    console.error('❌ Error loading Machine model:', error.message);
}

try {
    const ProductionEntry = require('./src/models/ProductionEntry');
    console.log('✅ ProductionEntry model loaded successfully');
} catch (error) {
    console.error('❌ Error loading ProductionEntry model:', error.message);
}

try {
    const DowntimeEntry = require('./src/models/DowntimeEntry');
    console.log('✅ DowntimeEntry model loaded successfully');
} catch (error) {
    console.error('❌ Error loading DowntimeEntry model:', error.message);
}
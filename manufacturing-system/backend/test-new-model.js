console.log('Testing new User model...\n');

try {
    const User = require('./src/models/UserNew');
    console.log('✅ User model loaded');
    console.log('User.findByEmail exists:', typeof User.findByEmail === 'function');
    console.log('User.findById exists:', typeof User.findById === 'function');
    console.log('User.findAll exists:', typeof User.findAll === 'function');
    console.log('User.verifyPassword exists:', typeof User.verifyPassword === 'function');
    
    // Test actual database query
    User.findAll().then(users => {
        console.log(`\n✅ Found ${users.length} users in database`);
        if (users.length > 0) {
            console.log('Sample user:', users[0].email);
        }
        process.exit(0);
    }).catch(err => {
        console.error('❌ Database query failed:', err.message);
        process.exit(1);
    });
    
} catch (error) {
    console.error('❌ Error loading model:', error.message);
    process.exit(1);
}
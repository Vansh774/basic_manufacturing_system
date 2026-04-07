console.log('Testing User model only...\n');

const User = require('./src/models/User');

console.log('User object type:', typeof User);
console.log('User.findByEmail exists:', typeof User.findByEmail === 'function');
console.log('User.findById exists:', typeof User.findById === 'function');
console.log('User.findAll exists:', typeof User.findAll === 'function');
console.log('User.verifyPassword exists:', typeof User.verifyPassword === 'function');

async function test() {
    try {
        const users = await User.findAll();
        console.log(`\n✅ Found ${users.length} users in database`);
        if (users.length > 0) {
            console.log('Sample user:', users[0].email);
        }
        
        // Test findByEmail
        const user = await User.findByEmail('owner@factory.com');
        if (user) {
            console.log('\n✅ Found owner user:', user.name);
            
            // Test password verification
            const isValid = await User.verifyPassword('temp123', user.password);
            console.log('Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

test();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const login = async (req, res) => {
    try {
        console.log('\n=== Login Attempt ===');
        console.log('Request body:', req.body);
        
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }
        
        console.log(`Looking for user: ${email}`);
        
        // Find user by email
        const user = await User.findByEmail(email);
        
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        console.log('User found:', { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            role: user.role,
            hasPassword: !!user.password 
        });
        
        // Verify password
        const isValid = await User.verifyPassword(password, user.password);
        
        if (!isValid) {
            console.log('Invalid password');
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        console.log('Password verified successfully!');
        
        // Generate token
        const token = generateToken(user.id);
        
        // Prepare user response (exclude password)
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            shift: user.shift,
            assigned_machines: user.assigned_machines || []
        };
        
        console.log('Login successful for:', user.email);
        console.log('Token generated:', token.substring(0, 20) + '...');
        
        // Send response
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });
        
    } catch (error) {
        console.error('Login error details:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            error: 'Server error', 
            details: error.message 
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        res.json({ 
            success: true, 
            user: user 
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
};

module.exports = { login, getCurrentUser };
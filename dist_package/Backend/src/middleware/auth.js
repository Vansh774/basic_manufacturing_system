const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            throw new Error();
        }
        
        req.user = user;
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Required role: ' + roles.join(', ') });
        }
        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };
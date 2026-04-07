const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
    constructor() {
        this.pool = pool;
    }

    async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = $1';
            const result = await this.pool.query(query, [email]);
            return result.rows[0];
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = 'SELECT id, email, name, role, shift, assigned_machines, created_at FROM users WHERE id = $1';
            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            const query = 'SELECT id, email, name, role, shift, assigned_machines, created_at FROM users ORDER BY id';
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    }

    async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Error in verifyPassword:', error);
            return false;
        }
    }
}

// Create a singleton instance
const User = new UserModel();

module.exports = User;
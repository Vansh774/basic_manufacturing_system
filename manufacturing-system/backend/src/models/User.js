const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Create a plain object with methods
const User = {
    async create(userData) {
        const { email, password, name, role, shift, assigned_machines } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (email, password, name, role, shift, assigned_machines)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, name, role, shift, assigned_machines, created_at
        `;
        
        const values = [email, hashedPassword, name, role, shift, assigned_machines || []];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = $1';
            const result = await pool.query(query, [email]);
            return result.rows[0];
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    },

    async findById(id) {
        try {
            const query = 'SELECT id, email, name, role, shift, assigned_machines, created_at FROM users WHERE id = $1';
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    },

    async findAll() {
        try {
            const query = 'SELECT id, email, name, role, shift, assigned_machines, created_at FROM users ORDER BY id';
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    },

    async update(id, userData) {
        const { name, role, shift, assigned_machines } = userData;
        const query = `
            UPDATE users 
            SET name = $1, role = $2, shift = $3, assigned_machines = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING id, email, name, role, shift, assigned_machines
        `;
        const values = [name, role, shift, assigned_machines || [], id];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Error in verifyPassword:', error);
            return false;
        }
    }
};

module.exports = User;
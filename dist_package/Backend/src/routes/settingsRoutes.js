const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all settings
router.get('/', authMiddleware, roleMiddleware('owner'), async (req, res) => {
    try {
        console.log('Fetching settings...');
        const result = await pool.query('SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        console.log('Settings found:', Object.keys(settings).length);
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Update settings
router.put('/', authMiddleware, roleMiddleware('owner'), async (req, res) => {
    try {
        const { settings } = req.body;
        console.log('Updating settings:', settings);
        
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Invalid settings data' });
        }
        
        for (const [key, value] of Object.entries(settings)) {
            // Check if setting exists
            const checkResult = await pool.query(
                'SELECT setting_key FROM system_settings WHERE setting_key = $1',
                [key]
            );
            
            if (checkResult.rows.length > 0) {
                // Update existing setting
                await pool.query(
                    `UPDATE system_settings 
                     SET setting_value = $1, 
                         updated_at = CURRENT_TIMESTAMP, 
                         updated_by = $2 
                     WHERE setting_key = $3`,
                    [value.toString(), req.userId, key]
                );
                console.log(`Updated ${key} to ${value}`);
            } else {
                // Insert new setting
                await pool.query(
                    `INSERT INTO system_settings (setting_key, setting_value, updated_by)
                     VALUES ($1, $2, $3)`,
                    [key, value.toString(), req.userId]
                );
                console.log(`Inserted ${key} with value ${value}`);
            }
        }
        
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get single setting
router.get('/:key', authMiddleware, roleMiddleware('owner'), async (req, res) => {
    try {
        const { key } = req.params;
        const result = await pool.query(
            'SELECT setting_value FROM system_settings WHERE setting_key = $1',
            [key]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        
        res.json({ success: true, value: result.rows[0].setting_value });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
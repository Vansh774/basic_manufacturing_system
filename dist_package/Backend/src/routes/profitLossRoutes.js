const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get daily report with product breakdown
// Get daily report with product breakdown
router.get('/daily', authMiddleware, roleMiddleware('owner'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        console.log('Fetching daily report from:', startDate, 'to:', endDate);
        
        // Get production data from production_entries
        const query = `
            SELECT 
                date,
                SUM(quantity) as total_units,
                SUM(quantity * 4000) as total_value,
                0 as total_loss_value,
                SUM(quantity * 4000) as net_profit
            FROM production_entries
            WHERE date BETWEEN $1 AND $2
            GROUP BY date
            ORDER BY date DESC
        `;
        
        const result = await pool.query(query, [startDate, endDate]);
        
        console.log('Found', result.rows.length, 'days with data');
        
        res.json({ 
            success: true, 
            report: result.rows,
            productBreakdown: []
        });
    } catch (error) {
        console.error('Error in daily report:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get product-wise summary for a specific date
router.get('/products/:date', authMiddleware, roleMiddleware('owner'), async (req, res) => {
    try {
        const { date } = req.params;
        
        const query = `
            SELECT 
                product_name,
                total_units,
                total_value,
                ROUND((total_units::DECIMAL / NULLIF((
                    SELECT SUM(total_units) FROM product_wise_daily_summary WHERE date = $1
                ), 0) * 100), 2) as percentage
            FROM product_wise_daily_summary
            WHERE date = $1
            ORDER BY total_units DESC
        `;
        const result = await pool.query(query, [date]);
        
        res.json({ success: true, products: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get monthly report with product breakdown
router.get('/monthly/:year/:month', authMiddleware, roleMiddleware('owner'), async (req, res) => {
    try {
        const { year, month } = req.params;
        
        const query = `
            SELECT 
                DATE_TRUNC('month', date) as month,
                SUM(quantity) as total_units,
                SUM(quantity * 4000) as total_value,
                0 as total_loss_value,
                SUM(quantity * 4000) as net_profit
            FROM production_entries
            WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
            GROUP BY DATE_TRUNC('month', date)
        `;
        const result = await pool.query(query, [year, month]);
        
        res.json({ 
            success: true, 
            report: result.rows[0] || null,
            topProducts: []
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get summary
router.get('/summary', authMiddleware, roleMiddleware('owner'), async (req, res) => {
    try {
        const { periodType, year, month } = req.query;
        
        let query;
        let params = [];
        
        if (periodType === 'daily') {
            // For daily, we need to sum all days in the month
            query = `
                SELECT 
                    COALESCE(SUM(total_units), 0) as total_units,
                    COALESCE(SUM(total_value), 0) as total_value,
                    COALESCE(SUM(total_downtime_minutes), 0) as total_downtime_minutes,
                    COALESCE(SUM(total_loss_units), 0) as total_loss_units,
                    COALESCE(SUM(total_loss_value), 0) as total_loss_value,
                    COALESCE(SUM(net_profit), 0) as net_profit
                FROM daily_production_summary
                WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
            `;
            params = [year, month];
        } else if (periodType === 'monthly') {
            query = `
                SELECT 
                    COALESCE(SUM(total_units), 0) as total_units,
                    COALESCE(SUM(total_value), 0) as total_value,
                    COALESCE(SUM(total_downtime_minutes), 0) as total_downtime_minutes,
                    COALESCE(SUM(total_loss_units), 0) as total_loss_units,
                    COALESCE(SUM(total_loss_value), 0) as total_loss_value,
                    COALESCE(SUM(net_profit), 0) as net_profit
                FROM daily_production_summary
                WHERE EXTRACT(YEAR FROM date) = $1
            `;
            params = [year];
        } else {
            query = `
                SELECT 
                    COALESCE(SUM(total_units), 0) as total_units,
                    COALESCE(SUM(total_value), 0) as total_value,
                    COALESCE(SUM(total_downtime_minutes), 0) as total_downtime_minutes,
                    COALESCE(SUM(total_loss_units), 0) as total_loss_units,
                    COALESCE(SUM(total_loss_value), 0) as total_loss_value,
                    COALESCE(SUM(net_profit), 0) as net_profit
                FROM daily_production_summary
            `;
            params = [];
        }
        
        const result = await pool.query(query, params);
        
        // Format the numbers properly
        const summary = result.rows[0] || {
            total_units: 0,
            total_value: 0,
            total_downtime_minutes: 0,
            total_loss_units: 0,
            total_loss_value: 0,
            net_profit: 0
        };
        
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Error in summary:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
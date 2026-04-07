const pool = require('../config/db');

const ProfitLoss = {
    async calculateDailyProfitLoss(date) {
        const query = `
            SELECT * FROM calculate_daily_profit_loss($1)
        `;
        const result = await pool.query(query, [date]);
        return result.rows[0];
    },
    
    async saveDailySummary(date) {
        const profitLoss = await this.calculateDailyProfitLoss(date);
        
        const query = `
            INSERT INTO daily_production_summary (date, total_units, total_value, 
                total_downtime_minutes, total_loss_units, total_loss_value, net_profit)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (date) DO UPDATE SET
                total_units = EXCLUDED.total_units,
                total_value = EXCLUDED.total_value,
                total_downtime_minutes = EXCLUDED.total_downtime_minutes,
                total_loss_units = EXCLUDED.total_loss_units,
                total_loss_value = EXCLUDED.total_loss_value,
                net_profit = EXCLUDED.net_profit
            RETURNING *
        `;
        
        const values = [
            date, 
            profitLoss.production_units,
            profitLoss.production_value,
            profitLoss.downtime_minutes,
            profitLoss.loss_units,
            profitLoss.loss_value,
            profitLoss.net_profit
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    },
    
    async getDailyReport(startDate, endDate) {
        const query = `
            SELECT * FROM daily_production_summary
            WHERE date BETWEEN $1 AND $2
            ORDER BY date DESC
        `;
        const result = await pool.query(query, [startDate, endDate]);
        return result.rows;
    },
    
    async getMonthlyReport(year, month) {
        const query = `
            SELECT 
                DATE_TRUNC('month', date) as month,
                SUM(total_units) as total_units,
                SUM(total_value) as total_value,
                SUM(total_downtime_minutes) as total_downtime_minutes,
                SUM(total_loss_units) as total_loss_units,
                SUM(total_loss_value) as total_loss_value,
                SUM(net_profit) as net_profit
            FROM daily_production_summary
            WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
            GROUP BY DATE_TRUNC('month', date)
        `;
        const result = await pool.query(query, [year, month]);
        return result.rows[0];
    },
    
    async getYearlyReport(year) {
        const query = `
            SELECT 
                EXTRACT(MONTH FROM date) as month,
                SUM(total_units) as total_units,
                SUM(total_value) as total_value,
                SUM(total_downtime_minutes) as total_downtime_minutes,
                SUM(total_loss_units) as total_loss_units,
                SUM(total_loss_value) as total_loss_value,
                SUM(net_profit) as net_profit
            FROM daily_production_summary
            WHERE EXTRACT(YEAR FROM date) = $1
            GROUP BY EXTRACT(MONTH FROM date)
            ORDER BY month
        `;
        const result = await pool.query(query, [year]);
        return result.rows;
    },
    
    async getProfitLossSummary(periodType, year, month = null) {
        let query;
        let params;
        
        if (periodType === 'daily') {
            query = `
                SELECT date, total_units, total_value, total_downtime_minutes, 
                       total_loss_units, total_loss_value, net_profit
                FROM daily_production_summary
                WHERE EXTRACT(YEAR FROM date) = $1
                ORDER BY date DESC
            `;
            params = [year];
        } else if (periodType === 'monthly') {
            query = `
                SELECT 
                    DATE_TRUNC('month', date) as period,
                    SUM(total_units) as total_units,
                    SUM(total_value) as total_value,
                    SUM(total_downtime_minutes) as total_downtime_minutes,
                    SUM(total_loss_units) as total_loss_units,
                    SUM(total_loss_value) as total_loss_value,
                    SUM(net_profit) as net_profit
                FROM daily_production_summary
                WHERE EXTRACT(YEAR FROM date) = $1
                GROUP BY DATE_TRUNC('month', date)
                ORDER BY period DESC
            `;
            params = [year];
        } else if (periodType === 'yearly') {
            query = `
                SELECT 
                    EXTRACT(YEAR FROM date) as year,
                    SUM(total_units) as total_units,
                    SUM(total_value) as total_value,
                    SUM(total_downtime_minutes) as total_downtime_minutes,
                    SUM(total_loss_units) as total_loss_units,
                    SUM(total_loss_value) as total_loss_value,
                    SUM(net_profit) as net_profit
                FROM daily_production_summary
                GROUP BY EXTRACT(YEAR FROM date)
                ORDER BY year DESC
            `;
            params = [];
        }
        
        const result = await pool.query(query, params);
        return result.rows;
    }
};

// Controller functions
const getDailyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await ProfitLoss.getDailyReport(startDate, endDate);
        res.json({ success: true, report });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.params;
        const report = await ProfitLoss.getMonthlyReport(parseInt(year), parseInt(month));
        res.json({ success: true, report });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getYearlyReport = async (req, res) => {
    try {
        const { year } = req.params;
        const report = await ProfitLoss.getYearlyReport(parseInt(year));
        res.json({ success: true, report });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getProfitLossSummary = async (req, res) => {
    try {
        const { periodType, year, month } = req.query;
        const summary = await ProfitLoss.getProfitLossSummary(periodType, parseInt(year), month ? parseInt(month) : null);
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const generateAndSaveDailyReport = async (req, res) => {
    try {
        const { date } = req.body;
        const report = await ProfitLoss.saveDailySummary(date);
        res.json({ success: true, report });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getDailyReport,
    getMonthlyReport,
    getYearlyReport,
    getProfitLossSummary,
    generateAndSaveDailyReport
};
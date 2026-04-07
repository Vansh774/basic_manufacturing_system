const pool = require('../config/db');

const addProductionEntry = async (req, res) => {
    try {
        const { machine_id, product_id, shift, quantity } = req.body;
        const operator_id = req.userId;
        const date = new Date().toISOString().split('T')[0];
        
        console.log('=== Adding Production Entry ===');
        console.log('Machine ID:', machine_id);
        console.log('Product ID:', product_id);
        console.log('Shift:', shift);
        console.log('Quantity:', quantity);
        console.log('Operator ID:', operator_id);
        console.log('Date:', date);
        
        // Validate inputs
        if (!machine_id || !product_id || !shift || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // First check if the machine is running
        const machineCheck = await pool.query(
            'SELECT status FROM machines WHERE id = $1',
            [machine_id]
        );
        
        if (machineCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        if (machineCheck.rows[0].status !== 'running') {
            return res.status(400).json({ error: 'Machine must be running to add production' });
        }
        
        // Get product ID from product name if needed
        let productId = product_id;
        if (isNaN(product_id)) {
            const productResult = await pool.query(
                'SELECT id FROM products WHERE name = $1',
                [product_id]
            );
            if (productResult.rows.length === 0) {
                return res.status(400).json({ error: 'Product not found' });
            }
            productId = productResult.rows[0].id;
        }
        
        const query = `
            INSERT INTO production_entries (machine_id, product_id, operator_id, shift, date, quantity)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const values = [machine_id, productId, operator_id, shift, date, quantity];
        const result = await pool.query(query, values);
        
        console.log('Production entry added:', result.rows[0]);
        
        // Also update the daily production summary
        await pool.query(`
            INSERT INTO daily_production_summary (date, total_units, total_value)
            VALUES ($1, $2, $3)
            ON CONFLICT (date) DO UPDATE
            SET total_units = daily_production_summary.total_units + EXCLUDED.total_units,
                total_value = daily_production_summary.total_value + EXCLUDED.total_value
        `, [date, quantity, quantity * 4000]);
        
        res.status(201).json({ 
            success: true, 
            entry: result.rows[0] 
        });
        
    } catch (error) {
        console.error('Add production error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const getTodayProduction = async (req, res) => {
    try {
        const query = `
            SELECT COALESCE(SUM(quantity), 0) as total
            FROM production_entries
            WHERE date = CURRENT_DATE
        `;
        const result = await pool.query(query);
        console.log('Today\'s production total:', result.rows[0].total);
        res.json({ success: true, total: parseInt(result.rows[0].total) });
    } catch (error) {
        console.error('Get today production error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getProductionByDate = async (req, res) => {
    try {
        const { date } = req.params;
        console.log('Fetching production for date:', date);
        
        const query = `
            SELECT pe.*, m.machine_code, m.name as machine_name, p.name as product_name, u.name as operator_name
            FROM production_entries pe
            JOIN machines m ON pe.machine_id = m.id
            JOIN products p ON pe.product_id = p.id
            JOIN users u ON pe.operator_id = u.id
            WHERE pe.date = $1
            ORDER BY pe.created_at DESC
        `;
        const result = await pool.query(query, [date]);
        console.log(`Found ${result.rows.length} entries for ${date}`);
        res.json({ success: true, entries: result.rows });
    } catch (error) {
        console.error('Get production by date error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getShiftProductivity = async (req, res) => {
    try {
        const { date } = req.params;
        const query = `
            SELECT shift, SUM(quantity) as total
            FROM production_entries
            WHERE date = $1
            GROUP BY shift
            ORDER BY shift
        `;
        const result = await pool.query(query, [date]);
        res.json({ success: true, productivity: result.rows });
    } catch (error) {
        console.error('Get shift productivity error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    addProductionEntry,
    getTodayProduction,
    getProductionByDate,
    getShiftProductivity
};
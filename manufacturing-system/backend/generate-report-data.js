const pool = require('./src/config/db');

async function generateReportData() {
    try {
        console.log('Generating report data...');
        
        // Generate production entries for the last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Check if we already have data for this date
            const existing = await pool.query(
                'SELECT COUNT(*) FROM production_entries WHERE date = $1',
                [dateStr]
            );
            
            if (parseInt(existing.rows[0].count) === 0) {
                // Insert sample production for each machine
                const machines = await pool.query('SELECT id FROM machines LIMIT 5');
                const products = await pool.query('SELECT id FROM products LIMIT 3');
                const operators = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['operator']);
                
                for (const machine of machines.rows) {
                    for (const product of products.rows) {
                        const quantity = Math.floor(Math.random() * 400) + 100;
                        await pool.query(
                            `INSERT INTO production_entries (machine_id, product_id, operator_id, shift, date, quantity)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [machine.id, product.id, operators.rows[0].id, 'morning', dateStr, quantity]
                        );
                    }
                }
                console.log(`Added production for ${dateStr}`);
            }
            
            // Calculate and store daily summary
            await pool.query('SELECT calculate_daily_summary($1)', [dateStr]);
            console.log(`Calculated summary for ${dateStr}`);
        }
        
        console.log('✅ Report data generated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

generateReportData();
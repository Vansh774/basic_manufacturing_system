const pool = require('./src/config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testProductionEntry() {
    try {
        console.log('Testing production entry...');
        
        // Get a machine
        const machines = await pool.query('SELECT id FROM machines LIMIT 1');
        const machineId = machines.rows[0].id;
        
        // Get a product
        const products = await pool.query('SELECT id, name FROM products LIMIT 1');
        const product = products.rows[0];
        
        // Get an operator
        const operators = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['operator']);
        const operatorId = operators.rows[0].id;
        
        console.log('Machine ID:', machineId);
        console.log('Product:', product);
        console.log('Operator ID:', operatorId);
        
        // Insert production entry
        const query = `
            INSERT INTO production_entries (machine_id, product_id, operator_id, shift, date, quantity)
            VALUES ($1, $2, $3, $4, CURRENT_DATE, $5)
            RETURNING *
        `;
        
        const values = [machineId, product.id, operatorId, 'morning', 200];
        const result = await pool.query(query, values);
        
        console.log('Production entry added:', result.rows[0]);
        console.log('✅ Test successful!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

testProductionEntry();
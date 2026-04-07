const pool = require('../config/db');

class ProductionEntryModel {
    constructor() {
        this.pool = pool;
    }

    async create(entryData) {
        const { machine_id, product_id, operator_id, shift, date, quantity } = entryData;
        
        const query = `
            INSERT INTO production_entries (machine_id, product_id, operator_id, shift, date, quantity)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const values = [machine_id, product_id, operator_id, shift, date, quantity];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async findByDate(date) {
        const query = `
            SELECT pe.*, m.machine_code, m.name as machine_name, p.name as product_name, u.name as operator_name
            FROM production_entries pe
            JOIN machines m ON pe.machine_id = m.id
            JOIN products p ON pe.product_id = p.id
            JOIN users u ON pe.operator_id = u.id
            WHERE pe.date = $1
            ORDER BY pe.created_at DESC
        `;
        const result = await this.pool.query(query, [date]);
        return result.rows;
    }

    async getTodayTotal() {
        try {
            const query = `
                SELECT COALESCE(SUM(quantity), 0) as total
                FROM production_entries
                WHERE date = CURRENT_DATE
            `;
            const result = await this.pool.query(query);
            return result.rows[0].total;
        } catch (error) {
            console.error('Error in getTodayTotal:', error);
            return 0;
        }
    }

    async getShiftProductivity(date) {
        const query = `
            SELECT shift, SUM(quantity) as total
            FROM production_entries
            WHERE date = $1
            GROUP BY shift
            ORDER BY shift
        `;
        const result = await this.pool.query(query, [date]);
        return result.rows;
    }
}

const ProductionEntry = new ProductionEntryModel();
module.exports = ProductionEntry;
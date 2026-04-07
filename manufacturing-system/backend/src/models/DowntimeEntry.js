const pool = require('../config/db');

class DowntimeEntryModel {
    constructor() {
        this.pool = pool;
    }

    async create(entryData) {
        const { machine_id, reported_by, reason, start_time } = entryData;
        
        const query = `
            INSERT INTO downtime_entries (machine_id, reported_by, reason, start_time, status)
            VALUES ($1, $2, $3, $4, 'open')
            RETURNING *
        `;
        
        const values = [machine_id, reported_by, reason, start_time];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async findById(id) {
        const query = 'SELECT * FROM downtime_entries WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return result.rows[0];
    }

    async resolve(id, end_time, duration, resolved_by) {
        const query = `
            UPDATE downtime_entries 
            SET end_time = $1, duration = $2, status = 'resolved', resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;
        const values = [end_time, duration, resolved_by, id];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async findOpen() {
        try {
            const query = `
                SELECT de.*, m.machine_code, m.name as machine_name, u.name as reporter_name
                FROM downtime_entries de
                JOIN machines m ON de.machine_id = m.id
                JOIN users u ON de.reported_by = u.id
                WHERE de.status = 'open'
                ORDER BY de.start_time DESC
            `;
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in findOpen:', error);
            return [];
        }
    }
}

const DowntimeEntry = new DowntimeEntryModel();
module.exports = DowntimeEntry;
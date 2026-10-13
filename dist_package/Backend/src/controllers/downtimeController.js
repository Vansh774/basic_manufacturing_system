const pool = require('../config/db');

const DowntimeEntry = {
    async create(entryData) {
        const { machine_id, reported_by, reason_code, reason_name, start_time } = entryData;
        
        const query = `
            INSERT INTO downtime_entries (machine_id, reported_by, reason, start_time, status)
            VALUES ($1, $2, $3, $4, 'open')
            RETURNING *
        `;
        
        const values = [machine_id, reported_by, reason_name, start_time];
        const result = await pool.query(query, values);
        
        // Update machine status
        await pool.query(
            'UPDATE machines SET status = $1, current_downtime_reason = $2, downtime_start_time = $3 WHERE id = $4',
            ['stopped', reason_name, start_time, machine_id]
        );
        
        return result.rows[0];
    },
    
    async resolve(id, end_time, duration, resolved_by) {
        const query = `
            UPDATE downtime_entries 
            SET end_time = $1, duration = $2, status = 'resolved', resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;
        const values = [end_time, duration, resolved_by, id];
        const result = await pool.query(query, values);
        
        if (result.rows[0]) {
            // Update machine status back to running
            await pool.query(
                'UPDATE machines SET status = $1, current_downtime_reason = NULL, downtime_start_time = NULL WHERE id = $2',
                ['running', result.rows[0].machine_id]
            );
        }
        
        return result.rows[0];
    },
    
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
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in findOpen:', error);
            return [];
        }
    },
    
    async getDowntimeAnalytics(startDate, endDate) {
        try {
            let query = `
                SELECT 
                    reason,
                    COUNT(*) as occurrences,
                    SUM(duration) as total_duration,
                    AVG(duration) as avg_duration,
                    SUM(duration) * 50 as estimated_loss
                FROM downtime_entries
                WHERE status = 'resolved'
            `;
            
            const values = [];
            if (startDate && endDate) {
                query += ` AND start_time >= $1 AND start_time <= $2`;
                values.push(startDate, endDate);
            }
            
            query += ` GROUP BY reason ORDER BY total_duration DESC LIMIT 10`;
            
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error in getDowntimeAnalytics:', error);
            return [];
        }
    },
    
    async getMachineDowntimeStats() {
        try {
            const query = `
                SELECT 
                    m.id,
                    m.machine_code,
                    m.name,
                    COUNT(de.id) as downtime_count,
                    COALESCE(SUM(de.duration), 0) as total_downtime_minutes,
                    COALESCE(SUM(de.duration) * 50, 0) as total_loss
                FROM machines m
                LEFT JOIN downtime_entries de ON m.id = de.machine_id AND de.status = 'resolved'
                GROUP BY m.id, m.machine_code, m.name
                ORDER BY total_downtime_minutes DESC
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in getMachineDowntimeStats:', error);
            return [];
        }
    }
};

// Export controller functions
const reportDowntime = async (req, res) => {
    try {
        const { machine_id, reason } = req.body;
        const reported_by = req.userId;
        const start_time = new Date();
        
        const downtime = await DowntimeEntry.create({
            machine_id,
            reported_by,
            reason_name: reason,
            start_time
        });
        
        res.status(201).json({ success: true, downtime });
    } catch (error) {
        console.error('Report downtime error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const resolveDowntime = async (req, res) => {
    try {
        const { id } = req.params;
        const resolved_by = req.userId;
        const end_time = new Date();
        
        const downtime = await DowntimeEntry.findById(id);
        if (!downtime) {
            return res.status(404).json({ error: 'Downtime entry not found' });
        }
        
        const duration = Math.floor((end_time - new Date(downtime.start_time)) / (1000 * 60));
        const resolved = await DowntimeEntry.resolve(id, end_time, duration, resolved_by);
        
        res.json({ success: true, downtime: resolved });
    } catch (error) {
        console.error('Resolve downtime error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getOpenDowntime = async (req, res) => {
    try {
        const downtimes = await DowntimeEntry.findOpen();
        res.json({ success: true, downtimes });
    } catch (error) {
        console.error('Get open downtime error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getDowntimeAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const analytics = await DowntimeEntry.getDowntimeAnalytics(startDate, endDate);
        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Get downtime analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMachineDowntimeStats = async (req, res) => {
    try {
        const stats = await DowntimeEntry.getMachineDowntimeStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Get machine downtime stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add findById method to DowntimeEntry
DowntimeEntry.findById = async (id) => {
    const query = 'SELECT * FROM downtime_entries WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    reportDowntime,
    resolveDowntime,
    getOpenDowntime,
    getDowntimeAnalytics,
    getMachineDowntimeStats
};
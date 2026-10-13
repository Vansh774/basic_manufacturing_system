const pool = require('../config/db');

// Helper function to get system settings
const getSetting = async (key, defaultValue) => {
    try {
        const result = await pool.query(
            'SELECT setting_value FROM system_settings WHERE setting_key = $1',
            [key]
        );
        if (result.rows.length > 0) {
            return result.rows[0].setting_value;
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error getting setting ${key}:`, error);
        return defaultValue;
    }
};

const Machine = {
    async findAll() {
        try {
            const query = `
                SELECT 
                    m.*, 
                    u.name as operator_name,
                    COALESCE(mlt.today_loss_quantity, 0) as today_loss_quantity,
                    COALESCE(mlt.today_loss_amount, 0) as today_loss_amount,
                    m.current_downtime_reason
                FROM machines m
                LEFT JOIN users u ON m.current_operator_id = u.id
                LEFT JOIN (
                    SELECT machine_id, 
                           SUM(loss_quantity) as today_loss_quantity,
                           SUM(loss_amount) as today_loss_amount
                    FROM machine_loss_tracking
                    WHERE date = CURRENT_DATE AND downtime_type = 'unplanned'
                    GROUP BY machine_id
                ) mlt ON m.id = mlt.machine_id
                ORDER BY m.machine_code
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in Machine.findAll:', error);
            throw error;
        }
    },

    async findById(id) {
        const query = `
            SELECT m.*, u.name as operator_name
            FROM machines m
            LEFT JOIN users u ON m.current_operator_id = u.id
            WHERE m.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    async updateStatus(id, status, reason = null, operatorId = null) {
        try {
            console.log(`Updating machine ${id} to status: ${status}`);
            
            // First, get current machine status
            const currentMachine = await pool.query(
                'SELECT status, production_rate_per_hour, downtime_start_time, current_downtime_reason, current_product FROM machines WHERE id = $1',
                [id]
            );
            
            if (currentMachine.rows.length === 0) {
                throw new Error('Machine not found');
            }
            
            const oldStatus = currentMachine.rows[0].status;
            const productionRate = currentMachine.rows[0].production_rate_per_hour;
            let downtimeStartTime = currentMachine.rows[0].downtime_start_time;
            const currentReason = currentMachine.rows[0].current_downtime_reason;
            const lastProduct = currentMachine.rows[0].current_product;
            
            let updateQuery;
            let params;
            
            if (status === 'running') {
                // When starting, keep the last product
                updateQuery = `
                    UPDATE machines 
                    SET status = $1, 
                        current_operator_id = $2, 
                        current_downtime_reason = NULL,
                        downtime_start_time = NULL,
                        is_running = true,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = $3
                    RETURNING *
                `;
                params = [status, operatorId, id];
                
                // Calculate loss ONLY if this was a manual stop (not "Day start reset")
                // Resolve any open downtime entries for this machine
                const calculatedDowntime = downtimeStartTime ? Math.max(1, Math.floor((new Date() - new Date(downtimeStartTime)) / (1000 * 60))) : null;
                await pool.query(`
                    UPDATE downtime_entries
                    SET end_time = CURRENT_TIMESTAMP,
                        duration = COALESCE($1, GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) / 60))),
                        status = 'resolved',
                        resolved_by = $2,
                        resolved_at = CURRENT_TIMESTAMP
                    WHERE machine_id = $3 AND status = 'open'
                `, [calculatedDowntime, operatorId, id]);

                // Calculate loss ONLY if this was a manual stop (not "Day start reset")
                const isPlannedStop = currentReason === 'Day start reset';
                
                if (oldStatus === 'stopped' && downtimeStartTime && !isPlannedStop) {
                    const startTime = new Date(downtimeStartTime);
                    const endTime = new Date();
                    const downtimeMinutes = Math.max(1, Math.floor((endTime - startTime) / (1000 * 60)));
                    
                    if (downtimeMinutes > 0) {
                        // Get current settings for calculations
                        const unitPrice = parseFloat(await getSetting('unit_price', '4000'));
                        const rate = productionRate || 500;
                        const lossQuantity = Math.floor((rate / 60) * downtimeMinutes);
                        const lossAmount = lossQuantity * unitPrice;
                        
                        console.log(`Calculating loss: ${lossQuantity} units, ₹${lossAmount}, ${downtimeMinutes} minutes`);
                        
                        // Insert loss tracking
                        await pool.query(`
                            INSERT INTO machine_loss_tracking (machine_id, date, loss_quantity, loss_amount, downtime_minutes, reason, downtime_type)
                            VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, 'unplanned')
                            ON CONFLICT (machine_id, date) DO UPDATE
                            SET loss_quantity = machine_loss_tracking.loss_quantity + EXCLUDED.loss_quantity,
                                loss_amount = machine_loss_tracking.loss_amount + EXCLUDED.loss_amount,
                                downtime_minutes = machine_loss_tracking.downtime_minutes + EXCLUDED.downtime_minutes,
                                reason = EXCLUDED.reason
                        `, [id, lossQuantity, lossAmount, downtimeMinutes, currentReason || reason]);
                    }
                }
            } else if (status === 'stopped') {
                const isPlannedStop = (reason === 'Day end shutdown' || reason === 'Shift end');
                
                updateQuery = `
                    UPDATE machines 
                    SET status = $1, 
                        current_operator_id = $2, 
                        current_downtime_reason = $3,
                        downtime_start_time = CURRENT_TIMESTAMP,
                        is_running = false,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = $4
                    RETURNING *
                `;
                params = [status, operatorId, reason, id];
                
                // Log the stop with type
                await pool.query(`
                    INSERT INTO machine_status_log (machine_id, previous_status, new_status, reason, changed_by, downtime_start_time, downtime_type)
                    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
                `, [id, oldStatus, status, reason, operatorId, isPlannedStop ? 'planned' : 'unplanned']);

                // Create open downtime entry
                await pool.query(`
                    INSERT INTO downtime_entries (machine_id, reported_by, start_time, reason, status)
                    VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 'open')
                `, [id, operatorId, reason || 'Unspecified']);
            } else {
                // For maintenance
                updateQuery = `
                    UPDATE machines 
                    SET status = $1, 
                        current_operator_id = $2, 
                        is_running = false,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = $3
                    RETURNING *
                `;
                params = [status, operatorId, id];
            }
            
            const result = await pool.query(updateQuery, params);
            
            if (result.rows.length === 0) {
                throw new Error(`Machine with id ${id} not found`);
            }
            
            // Get updated loss data (only unplanned losses)
            const lossData = await pool.query(`
                SELECT 
                    COALESCE(SUM(loss_quantity), 0) as today_loss_quantity,
                    COALESCE(SUM(loss_amount), 0) as today_loss_amount
                FROM machine_loss_tracking
                WHERE machine_id = $1 AND date = CURRENT_DATE AND downtime_type = 'unplanned'
            `, [id]);
            
            const updatedMachine = {
                ...result.rows[0],
                today_loss_quantity: lossData.rows[0].today_loss_quantity,
                today_loss_amount: lossData.rows[0].today_loss_amount,
                current_product: lastProduct
            };
            
            console.log('Machine updated successfully:', updatedMachine);
            return updatedMachine;
            
        } catch (error) {
            console.error('Error in updateStatus:', error);
            throw error;
        }
    },

    async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'running' THEN 1 END) as running,
                    COUNT(CASE WHEN status = 'stopped' THEN 1 END) as stopped,
                    COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
                    COALESCE(SUM(mlt.loss_amount), 0) as total_loss_amount_today
                FROM machines m
                LEFT JOIN machine_loss_tracking mlt ON m.id = mlt.machine_id AND mlt.date = CURRENT_DATE AND mlt.downtime_type = 'unplanned'
            `;
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error in Machine.getStats:', error);
            throw error;
        }
    },
    
    async getLossAnalytics() {
        try {
            const query = `
                SELECT 
                    m.id,
                    m.machine_code,
                    m.name,
                    m.production_rate_per_hour,
                    COALESCE(mlt.loss_quantity, 0) as today_loss_quantity,
                    COALESCE(mlt.loss_amount, 0) as today_loss_amount,
                    COALESCE(mlt.downtime_minutes, 0) as today_downtime_minutes,
                    m.current_downtime_reason as current_reason
                FROM machines m
                LEFT JOIN machine_loss_tracking mlt ON m.id = mlt.machine_id AND mlt.date = CURRENT_DATE AND mlt.downtime_type = 'unplanned'
                WHERE m.status = 'stopped'
                ORDER BY mlt.loss_amount DESC NULLS LAST
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in getLossAnalytics:', error);
            return [];
        }
    },
    
    async getTopLossReasons() {
        try {
            const query = `
                SELECT 
                    reason,
                    COUNT(*) as occurrences,
                    SUM(loss_quantity) as total_loss_quantity,
                    SUM(loss_amount) as total_loss_amount,
                    SUM(downtime_minutes) as total_downtime_minutes
                FROM machine_loss_tracking
                WHERE date >= CURRENT_DATE - INTERVAL '30 days'
                AND reason IS NOT NULL
                AND downtime_type = 'unplanned'
                GROUP BY reason
                ORDER BY total_loss_amount DESC
                LIMIT 10
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in getTopLossReasons:', error);
            return [];
        }
    }
};

module.exports = Machine;
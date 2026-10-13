const pool = require('../config/db');
const Machine = require('../models/Machine');

const getMachines = async (req, res) => {
    try {
        const machines = await Machine.findAll();
        res.json({ success: true, machines });
    } catch (error) {
        console.error('Get machines error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const getMachineStats = async (req, res) => {
    try {
        const stats = await Machine.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Get machine stats error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const updateMachineStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const operatorId = req.userId;
        
        console.log('=== Update Machine Status Request ===');
        console.log('Machine ID:', id);
        console.log('Status:', status);
        console.log('Reason:', reason);
        console.log('Operator ID:', operatorId);
        
        // Validate status
        if (!['running', 'stopped', 'maintenance'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const machine = await Machine.updateStatus(parseInt(id), status, reason, operatorId);
        
        // Emit Socket.io alert when a machine is marked as stopped
        if (status === 'stopped') {
            const io = req.app.get('io');
            if (io) {
                const alertPayload = {
                    machine_code: machine.machine_code,
                    machine_name: machine.name,
                    reason: reason || machine.current_downtime_reason || 'Unspecified',
                    timestamp: new Date().toISOString(),
                    operator_id: operatorId
                };
                console.log('📡 Emitting machine_stopped_alert:', alertPayload);
                io.emit('machine_stopped_alert', alertPayload);
            }
        }
        
        res.json({ success: true, machine });
        
    } catch (error) {
        console.error('Update machine status error:', error);
        res.status(500).json({ 
            error: 'Server error', 
            details: error.message 
        });
    }
};

// Add this new function
const setMachineProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { product } = req.body;
        
        console.log(`Setting machine ${id} product to: ${product}`);
        
        const result = await pool.query(`
            UPDATE machines 
            SET current_product = $1,
                last_updated = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [product, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        res.json({ success: true, machine: result.rows[0] });
    } catch (error) {
        console.error('Error setting product:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getLossAnalytics = async (req, res) => {
    try {
        const lossData = await Machine.getLossAnalytics();
        res.json({ success: true, lossData });
    } catch (error) {
        console.error('Get loss analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getTopLossReasons = async (req, res) => {
    try {
        const reasons = await Machine.getTopLossReasons();
        res.json({ success: true, reasons });
    } catch (error) {
        console.error('Get top loss reasons error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const sendAlert = async (machineName, reason, duration) => {
    try {
        const settings = await pool.query('SELECT setting_key, setting_value FROM system_settings');
        const settingsMap = {};
        settings.rows.forEach(row => {
            settingsMap[row.setting_key] = row.setting_value;
        });
        
        const message = `⚠️ Alert: ${machineName} stopped for ${duration} minutes\nReason: ${reason}`;
        
        // Send WhatsApp alert (using WhatsApp Business API)
        if (settingsMap.enable_whatsapp_alerts === 'true' && settingsMap.whatsapp_number) {
            // Integrate with WhatsApp Business API
            console.log(`WhatsApp alert to ${settingsMap.whatsapp_number}: ${message}`);
        }
        
        // Send SMS alert (using Twilio or other SMS service)
        if (settingsMap.enable_sms_alerts === 'true' && settingsMap.sms_number) {
            // Integrate with SMS service
            console.log(`SMS alert to ${settingsMap.sms_number}: ${message}`);
        }
    } catch (error) {
        console.error('Error sending alert:', error);
    }
};

const resetMachinesForNewDay = async (req, res) => {
    try {
        console.log('Reset request received from user:', req.userId);
        
        // Reset ALL machines with 'planned' downtime type
        const result = await pool.query(`
            UPDATE machines 
            SET status = 'stopped',
                current_downtime_reason = 'Day start reset',
                downtime_start_time = CURRENT_TIMESTAMP,
                current_operator_id = NULL,
                current_product = NULL,
                is_running = false,
                last_updated = CURRENT_TIMESTAMP
            RETURNING id, machine_code, name
        `);
        
        // Log the planned reset
        for (const machine of result.rows) {
            await pool.query(`
                INSERT INTO machine_status_log (machine_id, previous_status, new_status, reason, changed_by, downtime_start_time, downtime_type)
                VALUES ($1, $2, 'stopped', 'Day start reset', $3, CURRENT_TIMESTAMP, 'planned')
            `, [machine.id, machine.status, req.userId]);
        }
        
        console.log(`Reset completed. ${result.rows.length} machines updated.`);
        
        res.json({ 
            success: true, 
            message: `Reset ${result.rows.length} machines to stopped status`,
            resetCount: result.rows.length
        });
        
    } catch (error) {
        console.error('Reset error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

module.exports = { 
    getMachines, 
    getMachineStats, 
    updateMachineStatus,
    getLossAnalytics,
    getTopLossReasons,
    resetMachinesForNewDay,
    setMachineProduct 
};
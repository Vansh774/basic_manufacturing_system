const pool = require('../config/db');

/**
 * GET /api/analytics/downtime?range=today|1month|6months|1year
 * Calculates total downtime, total production loss in units, total loss in INR,
 * and breakdown by machine sorted by loss value descending.
 */
const getDowntimeAnalytics = async (req, res) => {
    try {
        const { range = 'today' } = req.query;

        // 1. Fetch current unit_price from system_settings (defaults to 4000)
        let unitPrice = 4000;
        try {
            const settingsResult = await pool.query(
                "SELECT setting_value FROM system_settings WHERE setting_key = 'unit_price'"
            );
            if (settingsResult.rows.length > 0 && !isNaN(parseFloat(settingsResult.rows[0].setting_value))) {
                unitPrice = parseFloat(settingsResult.rows[0].setting_value);
            }
        } catch (settingsErr) {
            console.error('Error reading unit_price setting, falling back to 4000:', settingsErr);
        }

        // 2. Build time filter condition
        let dateCondition = "de.start_time >= CURRENT_DATE";
        if (range === '1month') {
            dateCondition = "de.start_time >= CURRENT_DATE - INTERVAL '30 days'";
        } else if (range === '6months') {
            dateCondition = "de.start_time >= CURRENT_DATE - INTERVAL '180 days'";
        } else if (range === '1year') {
            dateCondition = "de.start_time >= CURRENT_DATE - INTERVAL '365 days'";
        }

        // 3. Query breakdown by machine
        // If an entry is still open, calculate duration dynamically based on elapsed minutes
        const query = `
            SELECT 
                m.id AS machine_id,
                m.machine_code,
                m.name AS machine_name,
                COALESCE(SUM(
                    COALESCE(de.duration, GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - de.start_time)) / 60)))
                ), 0)::integer AS downtime_minutes,
                COALESCE(SUM(
                    ROUND((COALESCE(m.production_rate_per_hour, 500)::numeric / 60.0) * 
                    COALESCE(de.duration, GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - de.start_time)) / 60))))
                ), 0)::integer AS loss_units,
                COALESCE(SUM(
                    ROUND((COALESCE(m.production_rate_per_hour, 500)::numeric / 60.0) * 
                    COALESCE(de.duration, GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - de.start_time)) / 60))) * $1)
                ), 0)::numeric AS loss_value
            FROM machines m
            JOIN downtime_entries de ON m.id = de.machine_id
            WHERE ${dateCondition}
            GROUP BY m.id, m.machine_code, m.name
            ORDER BY loss_value DESC, downtime_minutes DESC
        `;

        const result = await pool.query(query, [unitPrice]);
        const machineBreakdown = result.rows.map(row => ({
            machine_id: row.machine_id,
            machine_code: row.machine_code,
            machine_name: row.machine_name,
            downtime_minutes: parseInt(row.downtime_minutes) || 0,
            loss_units: parseInt(row.loss_units) || 0,
            loss_value: parseFloat(row.loss_value) || 0
        }));

        // 4. Calculate overall totals
        const totalDowntimeMinutes = machineBreakdown.reduce((sum, item) => sum + item.downtime_minutes, 0);
        const totalLossUnits = machineBreakdown.reduce((sum, item) => sum + item.loss_units, 0);
        const totalLossValue = machineBreakdown.reduce((sum, item) => sum + item.loss_value, 0);

        res.json({
            success: true,
            range,
            unit_price: unitPrice,
            total_downtime_minutes: totalDowntimeMinutes,
            total_loss_units: totalLossUnits,
            total_loss_value: totalLossValue,
            machine_breakdown: machineBreakdown
        });
    } catch (error) {
        console.error('Error fetching downtime analytics:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error', 
            details: error.message 
        });
    }
};

/**
 * GET /api/analytics/most-stopped?range=today|1month|6months|all&sortBy=count|duration
 * Returns ranking of machines that stopped the most, their stop count,
 * total stop time, and the primary reasons behind each machine's stops.
 * NOTE: DOES NOT INCLUDE ANY TOTAL LOSS VALUES (₹) as per specifications.
 */
const getMostStoppedMachines = async (req, res) => {
    try {
        const { range = '1month', sortBy = 'count' } = req.query;

        let dateCondition = "1=1";
        if (range === 'today') {
            dateCondition = "de.start_time >= CURRENT_DATE";
        } else if (range === '1month') {
            dateCondition = "de.start_time >= CURRENT_DATE - INTERVAL '30 days'";
        } else if (range === '6months') {
            dateCondition = "de.start_time >= CURRENT_DATE - INTERVAL '180 days'";
        } else if (range === '1year') {
            dateCondition = "de.start_time >= CURRENT_DATE - INTERVAL '365 days'";
        }

        const orderClause = sortBy === 'duration'
            ? "total_stop_time_minutes DESC, stop_count DESC"
            : "stop_count DESC, total_stop_time_minutes DESC";

        const query = `
            SELECT 
                m.id AS machine_id,
                m.machine_code,
                m.name AS machine_name,
                COUNT(de.id)::integer AS stop_count,
                COALESCE(SUM(
                    COALESCE(de.duration, GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - de.start_time)) / 60)))
                ), 0)::integer AS total_stop_time_minutes,
                MODE() WITHIN GROUP (ORDER BY de.reason) AS primary_reason,
                json_agg(
                    json_build_object(
                        'reason', de.reason,
                        'duration', COALESCE(de.duration, GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - de.start_time)) / 60)))
                    )
                ) AS raw_reasons
            FROM machines m
            JOIN downtime_entries de ON m.id = de.machine_id
            WHERE ${dateCondition}
            GROUP BY m.id, m.machine_code, m.name
            ORDER BY ${orderClause}
        `;

        const result = await pool.query(query);
        const machines = result.rows.map(row => {
            const reasonCounts = {};
            (row.raw_reasons || []).forEach(r => {
                const name = r.reason || 'Unspecified';
                if (!reasonCounts[name]) {
                    reasonCounts[name] = { count: 0, duration: 0 };
                }
                reasonCounts[name].count += 1;
                reasonCounts[name].duration += (parseInt(r.duration) || 0);
            });

            const reasonsSummary = Object.entries(reasonCounts)
                .map(([reason, stats]) => ({
                    reason,
                    count: stats.count,
                    duration: stats.duration
                }))
                .sort((a, b) => b.count - a.count || b.duration - a.duration);

            return {
                machine_id: row.machine_id,
                machine_code: row.machine_code,
                machine_name: row.machine_name,
                stop_count: parseInt(row.stop_count) || 0,
                total_stop_time_minutes: parseInt(row.total_stop_time_minutes) || 0,
                primary_reason: row.primary_reason || (reasonsSummary[0]?.reason || 'Unspecified'),
                reasons_summary: reasonsSummary
            };
        });

        const mostStoppedMachine = machines.length > 0 ? machines[0] : null;

        res.json({
            success: true,
            range,
            sortBy,
            most_stopped_machine: mostStoppedMachine,
            machines
        });
    } catch (error) {
        console.error('Error fetching most stopped machines:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error', 
            details: error.message 
        });
    }
};

module.exports = { getDowntimeAnalytics, getMostStoppedMachines };

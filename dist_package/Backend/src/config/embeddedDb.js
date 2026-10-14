const fs = require('fs');
const path = require('path');
let alasql = null;
try {
    alasql = require('alasql');
} catch (e) {
    // alasql optional
}

const dataDir = path.resolve(__dirname, '../../data');
const seedPath = path.join(dataDir, 'seed_data.json');
const dbPath = path.join(dataDir, 'embedded_db.json');

// In-memory state
let tables = {
    users: [],
    machines: [],
    products: [],
    production_entries: [],
    downtime_entries: [],
    machine_loss_tracking: [],
    system_settings: [],
    downtime_reasons: []
};

let isInitialized = false;

function loadDatabase() {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        let rawData = null;
        if (fs.existsSync(dbPath)) {
            rawData = fs.readFileSync(dbPath, 'utf8');
            console.log('📦 Loading existing embedded database from:', dbPath);
        } else if (fs.existsSync(seedPath)) {
            rawData = fs.readFileSync(seedPath, 'utf8');
            console.log('🌱 Seeding embedded database from:', seedPath);
        }

        if (rawData) {
            const parsed = JSON.parse(rawData);
            for (const key of Object.keys(tables)) {
                if (Array.isArray(parsed[key])) {
                    tables[key] = parsed[key];
                }
            }
            // Save initial snapshot to embedded_db.json
            if (!fs.existsSync(dbPath)) {
                saveDatabase();
            }
        }

        // Initialize alasql tables if available
        if (alasql) {
            try {
                for (const [key, rows] of Object.entries(tables)) {
                    alasql(`DROP TABLE IF EXISTS ${key}`);
                    alasql(`CREATE TABLE ${key}`);
                    alasql.tables[key].data = tables[key];
                }
            } catch (alaErr) {
                console.warn('⚠️ AlaSQL init warning:', alaErr.message);
            }
        }

        isInitialized = true;
        console.log(`✅ Embedded database ready: ${tables.machines.length} machines, ${tables.users.length} users, ${tables.downtime_entries.length} downtime records.`);
    } catch (err) {
        console.error('❌ Failed to load embedded database:', err);
    }
}

let saveTimer = null;
function saveDatabase() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(dbPath, JSON.stringify(tables, null, 2), 'utf8');
            // console.log('💾 Embedded database saved to disk');
        } catch (err) {
            console.error('❌ Failed to save embedded database:', err);
        }
    }, 150);
}

// Helper to filter entries by time range
function filterByRange(entries, dateField, range) {
    const now = new Date();
    let minTime = new Date();
    
    if (range === 'today') {
        minTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '1month' || range === '30days') {
        minTime.setDate(minTime.getDate() - 30);
    } else if (range === '6months' || range === '180days') {
        minTime.setDate(minTime.getDate() - 180);
    } else if (range === '1year' || range === '365days') {
        minTime.setDate(minTime.getDate() - 365);
    } else {
        return entries; // 'all' or default
    }

    return entries.filter(e => {
        const itemDate = new Date(e[dateField] || e.created_at);
        return itemDate >= minTime;
    });
}

/**
 * Execute query against embedded in-memory database
 */
async function runEmbeddedQuery(sql, params = []) {
    if (!isInitialized) {
        loadDatabase();
    }

    const trimmed = sql.trim().replace(/\s+/g, ' ');
    const lower = trimmed.toLowerCase();

    // 1. check_and_reset_new_day
    if (lower.includes('check_and_reset_new_day')) {
        tables.machines.forEach(m => {
            m.current_production = 0;
            m.today_loss_quantity = 0;
            m.today_loss_amount = 0;
        });
        saveDatabase();
        return { rows: [{ check_and_reset_new_day: true }], rowCount: 1 };
    }

    // 2. Users queries
    if (lower.includes('from users')) {
        if (lower.includes('where email =')) {
            const email = (params[0] || '').toLowerCase().trim();
            const user = tables.users.find(u => (u.email || '').toLowerCase().trim() === email);
            return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
        }
        if (lower.includes('where id =')) {
            const id = parseInt(params[0]);
            const user = tables.users.find(u => u.id === id);
            return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
        }
        return { rows: tables.users.map(u => ({ ...u })), rowCount: tables.users.length };
    }

    // 3. System settings queries
    if (lower.includes('from system_settings')) {
        if (lower.includes('where setting_key =')) {
            const key = params[0] || (trimmed.match(/setting_key\s*=\s*'([^']+)'/i) || [])[1];
            const setting = tables.system_settings.find(s => s.setting_key === key);
            return { rows: setting ? [{ ...setting }] : [], rowCount: setting ? 1 : 0 };
        }
        return { rows: tables.system_settings.map(s => ({ ...s })), rowCount: tables.system_settings.length };
    }

    // 4. Update system settings
    if (lower.startsWith('update system_settings')) {
        const key = params[1] || (trimmed.match(/where setting_key\s*=\s*'([^']+)'/i) || [])[1];
        const val = params[0];
        const setting = tables.system_settings.find(s => s.setting_key === key);
        if (setting) {
            setting.setting_value = String(val);
            setting.updated_at = new Date().toISOString();
        } else {
            tables.system_settings.push({
                id: tables.system_settings.length + 1,
                setting_key: key,
                setting_value: String(val),
                description: 'Updated via dashboard',
                updated_at: new Date().toISOString()
            });
        }
        saveDatabase();
        return { rows: setting ? [{ ...setting }] : [], rowCount: 1 };
    }

    // 5. Downtime Analytics Query
    if (lower.includes('from machines m') && lower.includes('join downtime_entries de') && lower.includes('group by m.id')) {
        // Detect range from SQL
        let range = 'today';
        if (lower.includes('365 days') || lower.includes('365')) range = '1year';
        else if (lower.includes('180 days') || lower.includes('180')) range = '6months';
        else if (lower.includes('30 days') || lower.includes('30')) range = '1month';

        const unitPrice = parseFloat(params[0]) || 4000;
        const filteredDowntime = filterByRange(tables.downtime_entries, 'start_time', range);

        // Group by machine
        const machineStats = {};
        tables.machines.forEach(m => {
            machineStats[m.id] = {
                machine_id: m.id,
                machine_code: m.machine_code,
                machine_name: m.name,
                production_rate_per_hour: m.production_rate_per_hour || 500,
                downtime_minutes: 0,
                loss_units: 0,
                loss_value: 0
            };
        });

        filteredDowntime.forEach(de => {
            const mid = de.machine_id;
            if (!machineStats[mid]) return;
            const duration = parseInt(de.duration) || (de.start_time ? Math.max(1, Math.round((Date.now() - new Date(de.start_time).getTime()) / 60000)) : 10);
            machineStats[mid].downtime_minutes += duration;
            const rate = machineStats[mid].production_rate_per_hour;
            const unitsLost = Math.round((rate / 60) * duration);
            machineStats[mid].loss_units += unitsLost;
            machineStats[mid].loss_value += Math.round(unitsLost * unitPrice);
        });

        // Filter machines that have downtime or return all sorted
        const breakdown = Object.values(machineStats)
            .filter(m => m.downtime_minutes > 0)
            .sort((a, b) => b.loss_value - a.loss_value || b.downtime_minutes - a.downtime_minutes);

        return { rows: breakdown, rowCount: breakdown.length };
    }

    // 6. Most Stopped Machines Query
    if (lower.includes('count(de.id)::integer as stop_count') || (lower.includes('from machines m join downtime_entries de') && lower.includes('stop_count'))) {
        let range = '1month';
        if (lower.includes('365 days')) range = '1year';
        else if (lower.includes('180 days')) range = '6months';
        else if (lower.includes('current_date') && !lower.includes('interval')) range = 'today';
        else if (lower.includes('1=1')) range = 'all';

        const filteredDowntime = filterByRange(tables.downtime_entries, 'start_time', range);

        const machineGroups = {};
        tables.machines.forEach(m => {
            machineGroups[m.id] = {
                machine_id: m.id,
                machine_code: m.machine_code,
                machine_name: m.name,
                stop_count: 0,
                total_stop_time_minutes: 0,
                reasons: {}
            };
        });

        filteredDowntime.forEach(de => {
            const mid = de.machine_id;
            if (!machineGroups[mid]) return;
            const duration = parseInt(de.duration) || 10;
            const reason = de.reason || 'Unspecified';
            machineGroups[mid].stop_count += 1;
            machineGroups[mid].total_stop_time_minutes += duration;
            if (!machineGroups[mid].reasons[reason]) {
                machineGroups[mid].reasons[reason] = { count: 0, duration: 0 };
            }
            machineGroups[mid].reasons[reason].count += 1;
            machineGroups[mid].reasons[reason].duration += duration;
        });

        const machines = Object.values(machineGroups)
            .filter(m => m.stop_count > 0)
            .map(m => {
                const reasonsSummary = Object.entries(m.reasons)
                    .map(([r, stats]) => ({ reason: r, count: stats.count, duration: stats.duration }))
                    .sort((a, b) => b.count - a.count || b.duration - a.duration);
                const primaryReason = reasonsSummary[0]?.reason || 'Unspecified';
                const rawReasons = Object.entries(m.reasons).map(([r, stats]) => ({ reason: r, duration: stats.duration }));
                return {
                    machine_id: m.machine_id,
                    machine_code: m.machine_code,
                    machine_name: m.machine_name,
                    stop_count: m.stop_count,
                    total_stop_time_minutes: m.total_stop_time_minutes,
                    primary_reason: primaryReason,
                    raw_reasons: rawReasons
                };
            })
            .sort((a, b) => b.stop_count - a.stop_count || b.total_stop_time_minutes - a.total_stop_time_minutes);

        return { rows: machines, rowCount: machines.length };
    }

    // 7. Machine list queries (with operator join & loss tracking)
    if (lower.includes('from machines') && lower.includes('select')) {
        if (lower.includes('where id =') || lower.includes('where m.id =')) {
            const id = parseInt(params[0]);
            const machine = tables.machines.find(m => m.id === id);
            if (!machine) return { rows: [], rowCount: 0 };
            const op = tables.users.find(u => u.id === machine.current_operator_id || u.id === machine.assigned_operator);
            return {
                rows: [{
                    ...machine,
                    operator_name: op ? op.name : null
                }],
                rowCount: 1
            };
        }

        // Return all machines enriched with operator name and today's loss
        const todayStr = new Date().toISOString().split('T')[0];
        const rows = tables.machines.map(m => {
            const op = tables.users.find(u => u.id === m.current_operator_id || u.id === m.assigned_operator);
            const todayLosses = tables.machine_loss_tracking.filter(l => l.machine_id === m.id && (l.date === todayStr || String(l.date).startsWith(todayStr)));
            const todayLossQty = todayLosses.reduce((sum, l) => sum + (parseInt(l.loss_quantity) || 0), 0);
            const todayLossAmt = todayLosses.reduce((sum, l) => sum + (parseFloat(l.loss_amount) || 0), 0);

            return {
                ...m,
                operator_name: op ? op.name : null,
                today_loss_quantity: todayLossQty,
                today_loss_amount: todayLossAmt
            };
        });

        rows.sort((a, b) => (a.machine_code || '').localeCompare(b.machine_code || ''));
        return { rows, rowCount: rows.length };
    }

    // 8. Update machine status & product
    if (lower.startsWith('update machines')) {
        let machineId = null;
        if (params.length > 0) {
            machineId = parseInt(params[params.length - 1]);
        }
        if (!machineId) {
            const idMatch = trimmed.match(/where\s+(?:m\.)?id\s*=\s*(\d+)/i);
            if (idMatch) machineId = parseInt(idMatch[1]);
        }

        const machine = tables.machines.find(m => m.id === machineId);
        if (machine) {
            if (lower.includes('set status =') || lower.includes('set status=')) {
                machine.status = params[0] || machine.status;
                if (params.length > 2 && typeof params[1] === 'number') {
                    machine.current_operator_id = params[1];
                }
            }
            if (lower.includes('current_downtime_reason')) {
                machine.current_downtime_reason = params[1] || null;
            }
            if (lower.includes('current_product =')) {
                machine.current_product = params[0];
            }
            machine.last_updated = new Date().toISOString();
            saveDatabase();
            return { rows: [{ ...machine }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 9. Downtime entries queries
    if (lower.includes('from downtime_entries')) {
        if (lower.includes("where machine_id =") && lower.includes("status = 'open'")) {
            const mid = parseInt(params[0]);
            const openEntries = tables.downtime_entries.filter(d => d.machine_id === mid && d.status === 'open');
            return { rows: openEntries, rowCount: openEntries.length };
        }
        if (lower.includes("where status = 'open'")) {
            const openEntries = tables.downtime_entries.filter(d => d.status === 'open');
            return { rows: openEntries, rowCount: openEntries.length };
        }
        return { rows: tables.downtime_entries.map(d => ({ ...d })), rowCount: tables.downtime_entries.length };
    }

    // 10. Insert downtime entry
    if (lower.startsWith('insert into downtime_entries')) {
        const newEntry = {
            id: tables.downtime_entries.length + 1,
            machine_id: params[0] || 1,
            reported_by: params[1] || null,
            start_time: params[2] || new Date().toISOString(),
            end_time: null,
            duration: null,
            reason: params[3] || 'Unspecified',
            status: 'open',
            created_at: new Date().toISOString()
        };
        tables.downtime_entries.push(newEntry);
        saveDatabase();
        return { rows: [{ ...newEntry }], rowCount: 1 };
    }

    // 11. Update downtime entry (resolve)
    if (lower.startsWith('update downtime_entries')) {
        let mid = params[params.length - 1];
        const openEntry = tables.downtime_entries.find(d => d.machine_id === parseInt(mid) && d.status === 'open');
        if (openEntry) {
            openEntry.status = 'resolved';
            openEntry.end_time = new Date().toISOString();
            openEntry.duration = params[0] || (openEntry.start_time ? Math.max(1, Math.round((Date.now() - new Date(openEntry.start_time).getTime()) / 60000)) : 10);
            openEntry.resolved_by = params[1] || null;
            openEntry.resolved_at = new Date().toISOString();
            saveDatabase();
            return { rows: [{ ...openEntry }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 12. Machine loss tracking queries & upsert
    if (lower.includes('from machine_loss_tracking')) {
        return { rows: tables.machine_loss_tracking.map(l => ({ ...l })), rowCount: tables.machine_loss_tracking.length };
    }
    if (lower.startsWith('insert into machine_loss_tracking')) {
        const machineId = params[0];
        const date = params[1] || new Date().toISOString().split('T')[0];
        const lossQty = parseInt(params[2]) || 0;
        const lossAmt = parseFloat(params[3]) || 0;
        const downtimeMin = parseInt(params[4]) || 0;
        const reason = params[5] || 'Unspecified';
        const type = params[6] || 'unplanned';

        const existing = tables.machine_loss_tracking.find(l => l.machine_id === machineId && l.date === date);
        if (existing) {
            existing.loss_quantity += lossQty;
            existing.loss_amount += lossAmt;
            existing.downtime_minutes += downtimeMin;
            existing.reason = reason;
            saveDatabase();
            return { rows: [{ ...existing }], rowCount: 1 };
        } else {
            const newRecord = {
                id: tables.machine_loss_tracking.length + 1,
                machine_id: machineId,
                date,
                loss_quantity: lossQty,
                loss_amount: lossAmt,
                downtime_minutes: downtimeMin,
                reason,
                downtime_type: type,
                created_at: new Date().toISOString()
            };
            tables.machine_loss_tracking.push(newRecord);
            saveDatabase();
            return { rows: [{ ...newRecord }], rowCount: 1 };
        }
    }

    // 13. Products queries
    if (lower.includes('from products')) {
        return { rows: tables.products.map(p => ({ ...p })), rowCount: tables.products.length };
    }

    // 14. Production entries queries
    if (lower.includes('from production_entries')) {
        let entries = tables.production_entries;
        if (params.length > 0 && typeof params[0] === 'string' && params[0].includes('-')) {
            entries = entries.filter(e => e.date === params[0]);
        }
        return { rows: entries.map(e => ({ ...e })), rowCount: entries.length };
    }
    if (lower.startsWith('insert into production_entries')) {
        const newEntry = {
            id: tables.production_entries.length + 1,
            machine_id: params[0],
            operator_id: params[1],
            product_id: params[2],
            quantity: params[3],
            shift: params[4] || 'Morning',
            date: params[5] || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
        };
        tables.production_entries.push(newEntry);
        saveDatabase();
        return { rows: [{ ...newEntry }], rowCount: 1 };
    }

    // 15. Downtime reasons
    if (lower.includes('from downtime_reasons')) {
        return { rows: tables.downtime_reasons.map(r => ({ ...r })), rowCount: tables.downtime_reasons.length };
    }

    // 16. Fallback to AlaSQL if available
    if (alasql) {
        try {
            const convertedSql = sql.replace(/\$[0-9]+/g, '?');
            const result = alasql(convertedSql, params);
            return { rows: Array.isArray(result) ? result : [result], rowCount: Array.isArray(result) ? result.length : 1 };
        } catch (alaErr) {
            console.warn('⚠️ AlaSQL fallback error:', alaErr.message, 'for SQL:', sql);
        }
    }

    // Default safe fallback
    return { rows: [], rowCount: 0 };
}

// Initial load
loadDatabase();

module.exports = {
    loadDatabase,
    saveDatabase,
    runEmbeddedQuery,
    getTables: () => tables
};

-- ============================================================
-- Downtime Analytics & Production Loss Report: Database Setup
-- ============================================================

-- 1. Ensure system_settings table and default unit_price
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('unit_price', '4000', 'Price per unit in INR')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value;

-- 2. Ensure machines columns and default production rate
ALTER TABLE machines ALTER COLUMN production_rate_per_hour SET DEFAULT 500;
UPDATE machines 
SET production_rate_per_hour = 500 
WHERE production_rate_per_hour IS NULL OR production_rate_per_hour = 60;

-- 3. Ensure machine_loss_tracking table
CREATE TABLE IF NOT EXISTS machine_loss_tracking (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    loss_quantity INTEGER DEFAULT 0,
    loss_amount NUMERIC(12, 2) DEFAULT 0,
    downtime_minutes INTEGER DEFAULT 0,
    reason VARCHAR(255),
    downtime_type VARCHAR(50) DEFAULT 'unplanned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_machine_date UNIQUE (machine_id, date)
);

-- 4. Ensure downtime_entries table
CREATE TABLE IF NOT EXISTS downtime_entries (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
    reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INTEGER,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP
);

-- 5. Clean up old sample downtime entries if any to insert clean 20 sample entries
DELETE FROM downtime_entries WHERE reason IN ('Material Shortage', 'Machine Issue', 'Power Problem', 'Quality Check', 'Other');

-- 6. Insert 20 Sample Downtime Entries across the last 60 days
-- TODAY (4 entries)
INSERT INTO downtime_entries (machine_id, reported_by, start_time, end_time, duration, reason, status, resolved_by, resolved_at)
VALUES 
(1, 3, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 25 minutes', 35, 'Material Shortage', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '1 hour 25 minutes'),
(2, 4, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours 10 minutes', 50, 'Machine Issue', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '3 hours 10 minutes'),
(3, 5, CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '5 hours 40 minutes', 20, 'Quality Check', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '5 hours 40 minutes'),
(4, 3, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '7 hours 15 minutes', 45, 'Power Problem', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '7 hours 15 minutes');

-- LAST 30 DAYS (8 entries)
INSERT INTO downtime_entries (machine_id, reported_by, start_time, end_time, duration, reason, status, resolved_by, resolved_at)
VALUES 
(5, 3, CURRENT_TIMESTAMP - INTERVAL '2 days' - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '2 days', 60, 'Machine Issue', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(6, 4, CURRENT_TIMESTAMP - INTERVAL '5 days' - INTERVAL '90 minutes', CURRENT_TIMESTAMP - INTERVAL '5 days', 90, 'Material Shortage', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, 5, CURRENT_TIMESTAMP - INTERVAL '8 days' - INTERVAL '25 minutes', CURRENT_TIMESTAMP - INTERVAL '8 days', 25, 'Quality Check', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(8, 3, CURRENT_TIMESTAMP - INTERVAL '12 days' - INTERVAL '110 minutes', CURRENT_TIMESTAMP - INTERVAL '12 days', 110, 'Power Problem', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '12 days'),
(1, 4, CURRENT_TIMESTAMP - INTERVAL '16 days' - INTERVAL '40 minutes', CURRENT_TIMESTAMP - INTERVAL '16 days', 40, 'Other', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '16 days'),
(2, 5, CURRENT_TIMESTAMP - INTERVAL '20 days' - INTERVAL '75 minutes', CURRENT_TIMESTAMP - INTERVAL '20 days', 75, 'Machine Issue', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '20 days'),
(3, 3, CURRENT_TIMESTAMP - INTERVAL '24 days' - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '24 days', 15, 'Quality Check', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '24 days'),
(4, 4, CURRENT_TIMESTAMP - INTERVAL '28 days' - INTERVAL '85 minutes', CURRENT_TIMESTAMP - INTERVAL '28 days', 85, 'Material Shortage', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '28 days');

-- 31 TO 60 DAYS AGO (8 entries)
INSERT INTO downtime_entries (machine_id, reported_by, start_time, end_time, duration, reason, status, resolved_by, resolved_at)
VALUES 
(5, 5, CURRENT_TIMESTAMP - INTERVAL '33 days' - INTERVAL '65 minutes', CURRENT_TIMESTAMP - INTERVAL '33 days', 65, 'Machine Issue', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '33 days'),
(6, 3, CURRENT_TIMESTAMP - INTERVAL '37 days' - INTERVAL '120 minutes', CURRENT_TIMESTAMP - INTERVAL '37 days', 120, 'Power Problem', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '37 days'),
(7, 4, CURRENT_TIMESTAMP - INTERVAL '41 days' - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '41 days', 30, 'Quality Check', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '41 days'),
(8, 5, CURRENT_TIMESTAMP - INTERVAL '45 days' - INTERVAL '95 minutes', CURRENT_TIMESTAMP - INTERVAL '45 days', 95, 'Material Shortage', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '45 days'),
(9, 3, CURRENT_TIMESTAMP - INTERVAL '49 days' - INTERVAL '55 minutes', CURRENT_TIMESTAMP - INTERVAL '49 days', 55, 'Other', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '49 days'),
(10, 4, CURRENT_TIMESTAMP - INTERVAL '53 days' - INTERVAL '70 minutes', CURRENT_TIMESTAMP - INTERVAL '53 days', 70, 'Machine Issue', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '53 days'),
(11, 5, CURRENT_TIMESTAMP - INTERVAL '57 days' - INTERVAL '105 minutes', CURRENT_TIMESTAMP - INTERVAL '57 days', 105, 'Power Problem', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '57 days'),
(12, 3, CURRENT_TIMESTAMP - INTERVAL '60 days' - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '60 days', 15, 'Quality Check', 'resolved', 2, CURRENT_TIMESTAMP - INTERVAL '60 days');

-- 7. Populate corresponding machine_loss_tracking entries
INSERT INTO machine_loss_tracking (machine_id, date, loss_quantity, loss_amount, downtime_minutes, reason, downtime_type)
SELECT 
    de.machine_id,
    de.start_time::date,
    ROUND((COALESCE(m.production_rate_per_hour, 500)::numeric / 60.0) * de.duration) as loss_quantity,
    ROUND((COALESCE(m.production_rate_per_hour, 500)::numeric / 60.0) * de.duration * 4000) as loss_amount,
    de.duration as downtime_minutes,
    de.reason,
    'unplanned' as downtime_type
FROM downtime_entries de
JOIN machines m ON de.machine_id = m.id
WHERE de.duration IS NOT NULL
ON CONFLICT (machine_id, date) DO UPDATE
SET loss_quantity = machine_loss_tracking.loss_quantity + EXCLUDED.loss_quantity,
    loss_amount = machine_loss_tracking.loss_amount + EXCLUDED.loss_amount,
    downtime_minutes = machine_loss_tracking.downtime_minutes + EXCLUDED.downtime_minutes;

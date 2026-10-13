-- Drop existing tables
DROP TABLE IF EXISTS daily_production_summary CASCADE;
DROP TABLE IF EXISTS machine_status_log CASCADE;
DROP TABLE IF EXISTS machine_loss_tracking CASCADE;
DROP TABLE IF EXISTS downtime_entries CASCADE;
DROP TABLE IF EXISTS production_entries CASCADE;
DROP TABLE IF EXISTS downtime_reasons CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('operator', 'manager', 'owner')),
    shift VARCHAR(50) CHECK (shift IN ('morning', 'evening', 'night')),
    assigned_machines INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Machines Table
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    machine_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'maintenance')),
    current_product VARCHAR(255),
    current_operator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    production_rate_per_hour INTEGER DEFAULT 60,
    current_downtime_reason VARCHAR(255),
    downtime_start_time TIMESTAMP,
    is_running BOOLEAN DEFAULT false,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    target_per_shift INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production Entries Table
CREATE TABLE production_entries (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    operator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    shift VARCHAR(50) NOT NULL CHECK (shift IN ('morning', 'evening', 'night')),
    date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Downtime Reasons Table
CREATE TABLE downtime_reasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Downtime Entries Table
CREATE TABLE downtime_entries (
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

-- Machine Loss Tracking Table
CREATE TABLE machine_loss_tracking (
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

-- Machine Status Log Table
CREATE TABLE machine_status_log (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    reason VARCHAR(255),
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    downtime_start_time TIMESTAMP,
    downtime_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Production Summary Table
CREATE TABLE daily_production_summary (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_units INTEGER DEFAULT 0,
    total_value NUMERIC(12, 2) DEFAULT 0,
    total_downtime_minutes INTEGER DEFAULT 0,
    total_loss_units INTEGER DEFAULT 0,
    total_loss_value NUMERIC(12, 2) DEFAULT 0,
    net_profit NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_production_entries_date ON production_entries(date);
CREATE INDEX idx_production_entries_machine ON production_entries(machine_id);
CREATE INDEX idx_downtime_entries_status ON downtime_entries(status);
CREATE INDEX idx_downtime_entries_start_time ON downtime_entries(start_time);
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_loss_tracking_date ON machine_loss_tracking(date);

-- Insert Default Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('unit_price', '4000', 'Price per unit in INR'),
('loss_per_minute', '333.33', 'Loss amount per minute of downtime'),
('production_rate_default', '500', 'Default production rate for new machines'),
('enable_whatsapp_alerts', 'false', 'Enable WhatsApp alerts for downtime'),
('enable_sms_alerts', 'false', 'Enable SMS alerts for downtime'),
('whatsapp_number', '', 'WhatsApp recipient phone number'),
('sms_number', '', 'SMS recipient phone number');

-- Insert 22 Machines
INSERT INTO machines (machine_code, name, status, production_rate_per_hour) VALUES
('M1', 'Injection Molding 1', 'running', 60),
('M2', 'Injection Molding 2', 'running', 60),
('M3', 'Injection Molding 3', 'stopped', 50),
('M4', 'Injection Molding 4', 'running', 60),
('M5', 'Assembly Line 1', 'running', 80),
('M6', 'Assembly Line 2', 'maintenance', 80),
('M7', 'Assembly Line 3', 'running', 80),
('M8', 'Assembly Line 4', 'stopped', 80),
('M9', 'Packaging Machine 1', 'running', 100),
('M10', 'Packaging Machine 2', 'running', 100),
('M11', 'Quality Control Station', 'running', 120),
('M12', 'Labeling Machine', 'stopped', 120),
('M13', 'CNC Machine 1', 'running', 40),
('M14', 'CNC Machine 2', 'maintenance', 40),
('M15', 'Welding Robot 1', 'running', 70),
('M16', 'Welding Robot 2', 'running', 70),
('M17', 'Painting Booth', 'stopped', 50),
('M18', 'Drying Oven', 'running', 90),
('M19', 'Testing Station', 'running', 100),
('M20', 'Forklift', 'running', 50),
('M21', 'Conveyor Belt 1', 'running', 150),
('M22', 'Conveyor Belt 2', 'maintenance', 150);

-- Insert Products
INSERT INTO products (name, sku, description, target_per_shift) VALUES
('Bucket', 'BKT-001', 'Standard industrial bucket', 500),
('Cover', 'CVR-001', 'Protective plastic cover', 450),
('Handle', 'HDL-001', 'Ergonomic handle component', 600),
('Lid', 'LID-001', 'Sealing lid with rim', 400),
('Base Plate', 'BSP-001', 'Reinforced base plate', 350),
('Support Bracket', 'SBK-001', 'Heavy-duty support bracket', 300);

-- Insert Downtime Reasons
INSERT INTO downtime_reasons (name, category) VALUES
('Material shortage', 'material'),
('Mechanical failure', 'mechanical'),
('Electrical issue', 'electrical'),
('Tool change', 'maintenance'),
('Operator break', 'operator'),
('Quality check', 'quality'),
('Cleaning', 'maintenance'),
('Software issue', 'electrical'),
('Safety stop', 'safety'),
('Power outage', 'utility');

-- Insert Initial Users (password 'temp123' bcrypt hash: $2b$10$wK1m... will be set by hash-passwords script)
INSERT INTO users (email, password, name, role, shift) VALUES
('owner@factory.com', 'temp123', 'John Owner', 'owner', NULL),
('manager@factory.com', 'temp123', 'Jane Manager', 'manager', NULL),
('operator1@factory.com', 'temp123', 'Bob Operator', 'operator', 'morning'),
('operator2@factory.com', 'temp123', 'Alice Worker', 'operator', 'evening'),
('operator3@factory.com', 'temp123', 'Charlie Labor', 'operator', 'night');

-- Function to calculate daily profit loss
CREATE OR REPLACE FUNCTION calculate_daily_profit_loss(target_date DATE)
RETURNS TABLE (
    production_units BIGINT,
    production_value NUMERIC,
    downtime_minutes BIGINT,
    loss_units BIGINT,
    loss_value NUMERIC,
    net_profit NUMERIC
) AS $$
DECLARE
    v_unit_price NUMERIC;
    v_prod_units BIGINT;
    v_prod_value NUMERIC;
    v_dt_minutes BIGINT;
    v_loss_units BIGINT;
    v_loss_val NUMERIC;
BEGIN
    SELECT COALESCE(setting_value::NUMERIC, 4000) INTO v_unit_price
    FROM system_settings WHERE setting_key = 'unit_price';
    IF v_unit_price IS NULL THEN v_unit_price := 4000; END IF;

    SELECT COALESCE(SUM(pe.quantity), 0) INTO v_prod_units
    FROM production_entries pe WHERE pe.date = target_date;

    v_prod_value := v_prod_units * v_unit_price;

    SELECT 
        COALESCE(SUM(mlt.downtime_minutes), 0),
        COALESCE(SUM(mlt.loss_quantity), 0),
        COALESCE(SUM(mlt.loss_amount), 0)
    INTO v_dt_minutes, v_loss_units, v_loss_val
    FROM machine_loss_tracking mlt
    WHERE mlt.date = target_date;

    RETURN QUERY SELECT 
        v_prod_units,
        v_prod_value,
        v_dt_minutes,
        v_loss_units,
        v_loss_val,
        (v_prod_value - v_loss_val);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and save daily summary
CREATE OR REPLACE FUNCTION calculate_daily_summary(target_date DATE)
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    SELECT * INTO rec FROM calculate_daily_profit_loss(target_date);
    
    INSERT INTO daily_production_summary (
        date, total_units, total_value, total_downtime_minutes,
        total_loss_units, total_loss_value, net_profit
    ) VALUES (
        target_date, rec.production_units, rec.production_value, rec.downtime_minutes,
        rec.loss_units, rec.loss_value, rec.net_profit
    )
    ON CONFLICT (date) DO UPDATE SET
        total_units = EXCLUDED.total_units,
        total_value = EXCLUDED.total_value,
        total_downtime_minutes = EXCLUDED.total_downtime_minutes,
        total_loss_units = EXCLUDED.total_loss_units,
        total_loss_value = EXCLUDED.total_loss_value,
        net_profit = EXCLUDED.net_profit;
END;
$$ LANGUAGE plpgsql;

-- Function check_and_reset_new_day
CREATE OR REPLACE FUNCTION check_and_reset_new_day()
RETURNS VOID AS $$
BEGIN
    UPDATE machines 
    SET status = 'stopped',
        current_downtime_reason = 'Day start reset',
        downtime_start_time = CURRENT_TIMESTAMP,
        current_operator_id = NULL,
        current_product = NULL,
        is_running = false,
        last_updated = CURRENT_TIMESTAMP
    WHERE status != 'stopped';
END;
$$ LANGUAGE plpgsql;

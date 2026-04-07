-- Drop tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS downtime_entries CASCADE;
DROP TABLE IF EXISTS production_entries CASCADE;
DROP TABLE IF EXISTS downtime_reasons CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
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
    status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'stopped', 'maintenance')),
    current_product VARCHAR(255),
    current_operator_id INTEGER REFERENCES users(id),
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
    machine_id INTEGER REFERENCES machines(id),
    product_id INTEGER REFERENCES products(id),
    operator_id INTEGER REFERENCES users(id),
    shift VARCHAR(50) NOT NULL CHECK (shift IN ('morning', 'evening', 'night')),
    date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    approved_by INTEGER REFERENCES users(id),
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
    machine_id INTEGER REFERENCES machines(id),
    reported_by INTEGER REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INTEGER,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_production_entries_date ON production_entries(date);
CREATE INDEX idx_production_entries_machine ON production_entries(machine_id);
CREATE INDEX idx_downtime_entries_status ON downtime_entries(status);
CREATE INDEX idx_downtime_entries_start_time ON downtime_entries(start_time);
CREATE INDEX idx_machines_status ON machines(status);

-- Insert Sample Data

-- Insert Machines (22 machines)
INSERT INTO machines (machine_code, name, status) VALUES
('M1', 'Injection Molding 1', 'running'),
('M2', 'Injection Molding 2', 'running'),
('M3', 'Injection Molding 3', 'stopped'),
('M4', 'Injection Molding 4', 'running'),
('M5', 'Assembly Line 1', 'running'),
('M6', 'Assembly Line 2', 'maintenance'),
('M7', 'Assembly Line 3', 'running'),
('M8', 'Assembly Line 4', 'stopped'),
('M9', 'Packaging Machine 1', 'running'),
('M10', 'Packaging Machine 2', 'running'),
('M11', 'Quality Control Station', 'running'),
('M12', 'Labeling Machine', 'stopped'),
('M13', 'CNC Machine 1', 'running'),
('M14', 'CNC Machine 2', 'maintenance'),
('M15', 'Welding Robot 1', 'running'),
('M16', 'Welding Robot 2', 'running'),
('M17', 'Painting Booth', 'stopped'),
('M18', 'Drying Oven', 'running'),
('M19', 'Testing Station', 'running'),
('M20', 'Forklift', 'running'),
('M21', 'Conveyor Belt 1', 'running'),
('M22', 'Conveyor Belt 2', 'maintenance');

-- Insert Products
INSERT INTO products (name, sku, target_per_shift) VALUES
('Bucket', 'BKT-001', 500),
('Cover', 'CVR-001', 450),
('Handle', 'HDL-001', 600),
('Lid', 'LID-001', 400),
('Base Plate', 'BSP-001', 350),
('Support Bracket', 'SBK-001', 300);

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

-- Insert Demo Users (passwords will be hashed in application)
-- Note: We'll insert them with bcrypt hash, but for now insert with placeholder
INSERT INTO users (email, name, role, shift) VALUES
('owner@factory.com', 'John Owner', 'owner', NULL),
('manager@factory.com', 'Jane Manager', 'manager', NULL),
('operator1@factory.com', 'Bob Operator', 'operator', 'morning'),
('operator2@factory.com', 'Alice Worker', 'operator', 'evening'),
('operator3@factory.com', 'Charlie Labor', 'operator', 'night');

-- Update users with hashed passwords (we'll do this via API later)
-- For now, we'll create a simple script to update passwords

-- Display results
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as total_machines FROM machines;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_users FROM users;
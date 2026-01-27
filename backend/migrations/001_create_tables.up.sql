-- Migration: Create activity_logs table
-- Description: Stores user activity logs from BIDICS system
-- Version: 001
-- Date: 2026-01-27

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(50),
    province_id VARCHAR(10),
    unit_id VARCHAR(50),
    session_id VARCHAR(255),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_username ON activity_logs(username);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_province_id ON activity_logs(province_id);
CREATE INDEX idx_activity_logs_unit_id ON activity_logs(unit_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_status ON activity_logs(status);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Create provinces reference table
CREATE TABLE IF NOT EXISTS provinces (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create organizational units table
CREATE TABLE IF NOT EXISTS organizational_units (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(50),
    type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES organizational_units(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (username, password_hash, email, full_name, role) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@bpk.go.id', 'Admin BPK', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample provinces
INSERT INTO provinces (id, name, region) VALUES
('11', 'Aceh', 'Sumatera'),
('12', 'Sumatera Utara', 'Sumatera'),
('13', 'Sumatera Barat', 'Sumatera'),
('31', 'DKI Jakarta', 'Jawa'),
('32', 'Jawa Barat', 'Jawa'),
('33', 'Jawa Tengah', 'Jawa'),
('34', 'DI Yogyakarta', 'Jawa'),
('35', 'Jawa Timur', 'Jawa'),
('51', 'Bali', 'Bali & Nusa Tenggara'),
('61', 'Kalimantan Barat', 'Kalimantan'),
('71', 'Sulawesi Utara', 'Sulawesi'),
('81', 'Maluku', 'Maluku'),
('91', 'Papua Barat', 'Papua')
ON CONFLICT (id) DO NOTHING;

-- Insert sample organizational units
INSERT INTO organizational_units (id, name, type) VALUES
('BPK-01', 'Biro TI', 'biro'),
('BPK-02', 'Inspektorat', 'inspektorat'),
('BPK-03', 'Sekretariat', 'sekretariat'),
('BPK-04', 'Auditorat Keuangan Negara I', 'auditorat'),
('BPK-05', 'Auditorat Keuangan Negara II', 'auditorat')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE activity_logs IS 'Stores all user activity logs from BIDICS system';
COMMENT ON TABLE users IS 'User authentication and authorization data';
COMMENT ON TABLE provinces IS 'Indonesian provinces reference data';
COMMENT ON TABLE organizational_units IS 'BPK organizational structure';

-- Migration: Create users table for authentication
-- Description: Table to store user and admin accounts
-- Version: 005
-- Date: 2026-02-05

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    full_name VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.username IS 'Unique username for login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN users.is_active IS 'Account active status';

-- Insert default admin account (password: admin123)
-- Bcrypt hash for 'admin123' (cost: 10)
INSERT INTO users (username, password_hash, role, full_name, email) 
VALUES ('admin', '$2a$10$7MyaMhqIImtLQ8Yzy5pGo.qW.NzRkRVf94Qw.dvlttmZPVR/uVqo2', 'admin', 'Administrator', 'admin@bpk.go.id')
ON CONFLICT (username) DO NOTHING;

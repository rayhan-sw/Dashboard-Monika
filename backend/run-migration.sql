-- Quick setup script untuk run migration
-- Run dengan: psql -U postgres -d actlog -f run-migration.sql

\echo 'Running migration 005: Create users table...'

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    full_name VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.username IS 'Unique username for login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN users.is_active IS 'Account active status';

-- Insert default admin (password: admin123)
INSERT INTO users (username, password_hash, role, full_name, email) 
VALUES ('admin', '$2a$10$7MyaMhqIImtLQ8Yzy5pGo.qW.NzRkRVf94Qw.dvlttmZPVR/uVqo2', 'admin', 'Administrator', 'admin@bpk.go.id')
ON CONFLICT (username) DO NOTHING;

\echo 'Migration completed successfully!'
\echo 'Default admin account:'
\echo '  Username: admin'
\echo '  Password: admin123'

-- Show created table
SELECT COUNT(*) as user_count FROM users;

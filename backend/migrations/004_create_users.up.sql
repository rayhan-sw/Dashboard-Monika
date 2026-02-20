-- Migration 004: Create users table (for dashboard authentication)

CREATE TABLE IF NOT EXISTS users (
    id                   SERIAL PRIMARY KEY,
    username             VARCHAR(100) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    role                 VARCHAR(20) NOT NULL DEFAULT 'user',
    full_name            VARCHAR(255),
    email                VARCHAR(255),
    is_active            BOOLEAN DEFAULT true,
    report_access_status VARCHAR(20) DEFAULT 'none',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login           TIMESTAMP
);

COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.username IS 'Unique username for login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN users.is_active IS 'Account active status';
COMMENT ON COLUMN users.report_access_status IS 'User report access status: none, pending, approved, rejected';

-- Default admin account (password: admin123 - CHANGE IN PRODUCTION)
INSERT INTO users (username, password_hash, role, full_name, email)
VALUES (
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    'Administrator',
    'admin@bpk.go.id'
) ON CONFLICT (username) DO NOTHING;

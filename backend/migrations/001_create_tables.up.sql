-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    username VARCHAR(255) NOT NULL,
    action VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    module VARCHAR(100),
    region VARCHAR(100),
    unit VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_username ON activity_logs(username);
CREATE INDEX idx_activity_logs_status ON activity_logs(status);
CREATE INDEX idx_activity_logs_module ON activity_logs(module);
CREATE INDEX idx_activity_logs_region ON activity_logs(region);
CREATE INDEX idx_activity_logs_unit ON activity_logs(unit);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    region VARCHAR(100),
    unit VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) 
VALUES (
    'admin',
    'admin@bpk.go.id',
    '$2a$10$xqZ7yC4fQ.xJ8P5ZnQ3F3eP5Bx9J8fX7ZnQ3F3eP5Bx9J8fX7ZnQ3',
    'admin'
) ON CONFLICT DO NOTHING;

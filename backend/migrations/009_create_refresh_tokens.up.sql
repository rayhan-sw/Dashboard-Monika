-- Create refresh_tokens table for storing active refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE, -- JWT ID (UUID) for token identification
    user_id INT NOT NULL,
    device_info VARCHAR(255), -- User agent or device identifier
    ip_address VARCHAR(45), -- IPv4 or IPv6
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_refresh_tokens_jti ON refresh_tokens(jti);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Comment for documentation
COMMENT ON TABLE refresh_tokens IS 'Stores active refresh tokens for JWT token rotation strategy';
COMMENT ON COLUMN refresh_tokens.jti IS 'JWT ID - unique identifier for each refresh token';
COMMENT ON COLUMN refresh_tokens.device_info IS 'User agent string for device tracking';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP address where token was issued';
COMMENT ON COLUMN refresh_tokens.last_used_at IS 'Last time this refresh token was used to get new access token';

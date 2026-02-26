-- Create token_blacklist table for invalidated tokens
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE, -- JWT ID to blacklist
    user_id INT NOT NULL,
    token_type VARCHAR(20) NOT NULL, -- 'access' or 'refresh'
    reason VARCHAR(50), -- logout, password_change, security, expired, etc
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL, -- When token would naturally expire (for cleanup)
    
    -- Foreign key constraint
    CONSTRAINT fk_token_blacklist_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes for fast lookup
CREATE INDEX idx_token_blacklist_jti ON token_blacklist(jti);
CREATE INDEX idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);
CREATE INDEX idx_token_blacklist_token_type ON token_blacklist(token_type);

-- Comment for documentation
COMMENT ON TABLE token_blacklist IS 'Stores invalidated JWT tokens for immediate revocation';
COMMENT ON COLUMN token_blacklist.jti IS 'JWT ID of the blacklisted token';
COMMENT ON COLUMN token_blacklist.token_type IS 'Type of token: access or refresh';
COMMENT ON COLUMN token_blacklist.reason IS 'Reason for blacklisting: logout, password_change, security, etc';
COMMENT ON COLUMN token_blacklist.expires_at IS 'Original expiry time of token (for cleanup purposes)';

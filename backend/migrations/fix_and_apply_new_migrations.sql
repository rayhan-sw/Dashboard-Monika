-- Fix Migration Tracking & Apply New Migrations
-- Run this script in DBeaver to fix migration issues and apply new tables

-- ==============================================================================
-- Step 1: Fix schema_migrations tracking (mark old migrations as applied)
-- ==============================================================================

-- Insert missing migrations that already exist in database
INSERT INTO schema_migrations (version, applied_at) 
VALUES 
    ('007_create_report_downloads', NOW()),
    ('008_add_profile_photo', NOW())
ON CONFLICT (version) DO NOTHING;

-- Verify tracking table
SELECT * FROM schema_migrations ORDER BY version;

-- ==============================================================================
-- Step 2: Apply Migration 009 - Create refresh_tokens table
-- ==============================================================================

-- Migration: Create refresh_tokens table for JWT refresh token management
-- Description: Stores active refresh tokens with device tracking
-- Version: 009
-- Date: 2026-02-26

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    jti UUID NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_info VARCHAR(500),
    ip_address VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Add comments
COMMENT ON TABLE refresh_tokens IS 'Stores active refresh tokens for JWT authentication with session tracking';
COMMENT ON COLUMN refresh_tokens.jti IS 'JWT ID (unique identifier for each token)';
COMMENT ON COLUMN refresh_tokens.device_info IS 'Device/browser information from User-Agent';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP address of the client';
COMMENT ON COLUMN refresh_tokens.last_used_at IS 'Last time this token was used to refresh access token';

-- Record migration
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('009_create_refresh_tokens', NOW())
ON CONFLICT (version) DO NOTHING;

-- ==============================================================================
-- Step 3: Apply Migration 010 - Create token_blacklist table
-- ==============================================================================

-- Migration: Create token_blacklist table for token revocation
-- Description: Stores blacklisted tokens (both access and refresh) for immediate revocation
-- Version: 010
-- Date: 2026-02-26

CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    jti UUID NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')),
    reason VARCHAR(100) NOT NULL,
    blacklisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for fast blacklist checking
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Add comments
COMMENT ON TABLE token_blacklist IS 'Stores blacklisted tokens for revocation (logout, password change, etc.)';
COMMENT ON COLUMN token_blacklist.jti IS 'JWT ID that has been revoked';
COMMENT ON COLUMN token_blacklist.token_type IS 'Type of token: access or refresh';
COMMENT ON COLUMN token_blacklist.reason IS 'Reason for blacklisting (logout, password_change, admin_revoke, etc.)';
COMMENT ON COLUMN token_blacklist.expires_at IS 'When this blacklist entry can be cleaned up (same as token expiry)';

-- Record migration
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('010_create_token_blacklist', NOW())
ON CONFLICT (version) DO NOTHING;

-- ==============================================================================
-- Step 4: Verify new tables were created
-- ==============================================================================

-- Check refresh_tokens table
SELECT 
    'refresh_tokens' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'refresh_tokens') as column_count
FROM refresh_tokens;

-- Check token_blacklist table
SELECT 
    'token_blacklist' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'token_blacklist') as column_count
FROM token_blacklist;

-- Check all migrations are tracked
SELECT * FROM schema_migrations ORDER BY version;

-- ==============================================================================
-- Step 5: Verify indexes were created
-- ==============================================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('refresh_tokens', 'token_blacklist')
ORDER BY tablename, indexname;

-- ==============================================================================
-- DONE! 
-- ==============================================================================
-- ✅ refresh_tokens table created
-- ✅ token_blacklist table created
-- ✅ All indexes created
-- ✅ Migration tracking updated
-- 
-- You can now test the authentication system with refresh tokens!
-- ==============================================================================

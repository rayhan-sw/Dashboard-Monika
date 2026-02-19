-- Migration: Add profile_photo and report_access_status to users table
-- Description: Add columns for user profile customization and report access tracking
-- Version: 008
-- Date: 2026-02-12

-- Add profile_photo column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Add report_access_status column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS report_access_status VARCHAR(20) DEFAULT 'none';

-- Update existing users to have proper report_access_status
UPDATE users 
SET report_access_status = CASE 
    WHEN role = 'admin' THEN 'approved'
    ELSE 'none'
END
WHERE report_access_status IS NULL OR report_access_status = '';

-- Add comments
COMMENT ON COLUMN users.profile_photo IS 'Base64 encoded profile photo or URL';
COMMENT ON COLUMN users.report_access_status IS 'Report access status: none, pending, approved, rejected';

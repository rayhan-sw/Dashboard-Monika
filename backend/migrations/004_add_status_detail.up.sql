-- Migration: Add missing columns to activity_logs
-- Description: Add status and detail_aktifitas columns to match seed data structure
-- Version: 004
-- Date: 2026-02-01

-- Add status column
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Add detail_aktifitas column
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS detail_aktifitas TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_detail_aktifitas ON activity_logs USING gin(to_tsvector('english', detail_aktifitas));

-- Add comments
COMMENT ON COLUMN activity_logs.status IS 'Activity status (SUCCESS, FAILED, etc.)';
COMMENT ON COLUMN activity_logs.detail_aktifitas IS 'Detailed description of the activity';

-- Migration: Add missing columns to act_log
-- Description: Add status and detail_aktifitas columns to match seed data structure
-- Version: 004
-- Date: 2026-02-01

-- Add status column
ALTER TABLE act_log 
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Add detail_aktifitas column
ALTER TABLE act_log 
ADD COLUMN IF NOT EXISTS detail_aktifitas TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_act_log_status ON act_log(status);
CREATE INDEX IF NOT EXISTS idx_act_log_detail_aktifitas ON act_log USING gin(to_tsvector('english', detail_aktifitas));

-- Add comments
COMMENT ON COLUMN act_log.status IS 'Activity status (SUCCESS, FAILED, etc.)';
COMMENT ON COLUMN act_log.detail_aktifitas IS 'Detailed description of the activity';


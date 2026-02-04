-- Migration: Remove status and detail_aktifitas columns
-- Description: Rollback migration 004
-- Version: 004
-- Date: 2026-02-01

-- Drop indexes first
DROP INDEX IF EXISTS idx_activity_logs_status;
DROP INDEX IF EXISTS idx_activity_logs_detail_aktifitas;

-- Drop columns
ALTER TABLE activity_logs DROP COLUMN IF EXISTS status;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS detail_aktifitas;

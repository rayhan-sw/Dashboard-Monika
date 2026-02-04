-- Migration: Remove status and detail_aktifitas columns
-- Description: Rollback migration 004
-- Version: 004
-- Date: 2026-02-01

-- Drop indexes first
DROP INDEX IF EXISTS idx_act_log_status;
DROP INDEX IF EXISTS idx_act_log_detail_aktifitas;

-- Drop columns
ALTER TABLE act_log DROP COLUMN IF EXISTS status;
ALTER TABLE act_log DROP COLUMN IF EXISTS detail_aktifitas;

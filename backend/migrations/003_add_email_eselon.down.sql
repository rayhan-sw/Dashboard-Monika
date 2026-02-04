-- Migration: Rollback email and eselon columns from act_log table
-- Description: Remove email and eselon columns
-- Version: 003
-- Date: 2026-02-04

-- Drop indexes
DROP INDEX IF EXISTS idx_act_log_email;
DROP INDEX IF EXISTS idx_act_log_eselon;

-- Remove email column
ALTER TABLE act_log DROP COLUMN IF EXISTS email;

-- Remove eselon column
ALTER TABLE act_log DROP COLUMN IF EXISTS eselon;

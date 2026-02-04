-- Migration: Add email and eselon columns to act_log table
-- Description: Adding email and eselon columns for user information
-- Version: 003
-- Date: 2026-02-04

-- Add email column
ALTER TABLE act_log ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add eselon column  
ALTER TABLE act_log ADD COLUMN IF NOT EXISTS eselon VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_act_log_email ON act_log(email);
CREATE INDEX IF NOT EXISTS idx_act_log_eselon ON act_log(eselon);

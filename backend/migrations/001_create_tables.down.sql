-- Migration Rollback: Drop all tables
-- Description: Removes all database tables and related objects
-- Version: 001
-- Date: 2026-01-31

-- Drop tables in reverse order to handle foreign key dependencies
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS organizational_units CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the act_log table if it exists (from imported data)
DROP TABLE IF EXISTS act_log CASCADE;

-- Note: Indexes will be automatically dropped with tables

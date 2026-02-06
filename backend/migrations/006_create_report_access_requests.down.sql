-- Migration: Drop report access requests table
-- Version: 006

-- Drop tables
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS report_access_requests;

-- Remove column from users
ALTER TABLE users DROP COLUMN IF EXISTS report_access_status;

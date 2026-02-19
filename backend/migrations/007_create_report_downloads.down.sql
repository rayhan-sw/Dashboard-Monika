-- Migration: Drop report_downloads table
-- Version: 007

DROP INDEX IF EXISTS idx_report_downloads_template_id;
DROP INDEX IF EXISTS idx_report_downloads_generated_at;
DROP INDEX IF EXISTS idx_report_downloads_user_id;
DROP TABLE IF EXISTS report_downloads;

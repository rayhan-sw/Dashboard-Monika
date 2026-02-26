-- Migration 011 Rollback: Remove rejection_count column from report_access_requests table

ALTER TABLE report_access_requests 
DROP COLUMN IF EXISTS rejection_count;

-- Migration 011: Add rejection_count column to report_access_requests table

ALTER TABLE report_access_requests 
ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN report_access_requests.rejection_count IS 'Number of times request has been rejected (max 3)';

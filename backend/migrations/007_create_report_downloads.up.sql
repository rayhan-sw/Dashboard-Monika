-- Migration: Create report_downloads table for tracking report downloads
-- Description: Table to track all report downloads by users/admins
-- Version: 007
-- Date: 2026-02-10

CREATE TABLE IF NOT EXISTS report_downloads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    template_id VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL,
    file_size VARCHAR(50),
    start_date DATE,
    end_date DATE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_report_downloads_user_id ON report_downloads(user_id);
CREATE INDEX idx_report_downloads_generated_at ON report_downloads(generated_at DESC);
CREATE INDEX idx_report_downloads_template_id ON report_downloads(template_id);

-- Add comment
COMMENT ON TABLE report_downloads IS 'Tracks all report downloads for audit and history purposes';

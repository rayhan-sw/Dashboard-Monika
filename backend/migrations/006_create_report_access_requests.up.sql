-- Migration: Create report access requests table
-- Description: Table to store user requests for report access
-- Version: 006
-- Date: 2026-02-05

-- Add report_access_status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS report_access_status VARCHAR(20) DEFAULT 'none';
-- Values: 'none' (belum request), 'pending' (menunggu), 'approved' (disetujui), 'rejected' (ditolak)

-- Create report access requests table
CREATE TABLE IF NOT EXISTS report_access_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    admin_notes TEXT
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT false,
    related_entity VARCHAR(50), -- 'report_access', 'system', etc.
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_report_access_requests_user_id ON report_access_requests(user_id);
CREATE INDEX idx_report_access_requests_status ON report_access_requests(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_users_report_access_status ON users(report_access_status);

-- Comments for documentation
COMMENT ON TABLE report_access_requests IS 'User requests for report page access';
COMMENT ON COLUMN report_access_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON COLUMN users.report_access_status IS 'User report access status: none, pending, approved, rejected';

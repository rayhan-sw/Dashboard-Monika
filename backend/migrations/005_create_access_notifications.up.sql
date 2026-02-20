-- Migration 005: Create report_access_requests and notifications tables

CREATE TABLE IF NOT EXISTS report_access_requests (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason       TEXT,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    admin_notes  TEXT
);

COMMENT ON TABLE report_access_requests IS 'User requests for report page access';
COMMENT ON COLUMN report_access_requests.status IS 'Request status: pending, approved, rejected';

CREATE TABLE IF NOT EXISTS notifications (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    message        TEXT NOT NULL,
    type           VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read        BOOLEAN DEFAULT false,
    related_entity VARCHAR(50),
    related_id     INTEGER,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notifications IS 'User notifications';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_rar_user_id            ON report_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rar_status             ON report_access_requests(status);

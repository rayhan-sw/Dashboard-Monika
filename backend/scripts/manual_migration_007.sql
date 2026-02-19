-- ============================================
-- Manual Migration Script
-- Apply migration 007: Create report_downloads table
-- Date: 2026-02-10
-- ============================================

-- Check current migrations
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- ============================================
-- Migration 007: Create report_downloads table
-- ============================================

BEGIN;

-- Create report_downloads table
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
CREATE INDEX IF NOT EXISTS idx_report_downloads_user_id ON report_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_report_downloads_generated_at ON report_downloads(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_downloads_template_id ON report_downloads(template_id);

-- Add comment
COMMENT ON TABLE report_downloads IS 'Tracks all report downloads for audit and history purposes';

-- Record this migration
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('007_create_report_downloads', NOW())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Verify the migration
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename = 'report_downloads';

-- Show table structure
\d report_downloads;

SELECT 'Migration 007 applied successfully!' AS status;

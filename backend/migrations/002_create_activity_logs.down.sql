-- Migration Down: Drop activity_logs table
-- Version: 002
-- Date: 2026-01-27

-- Drop trigger
DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON activity_logs;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_activity_logs_tanggal_aktifitas;
DROP INDEX IF EXISTS idx_activity_logs_satker_tanggal;
DROP INDEX IF EXISTS idx_activity_logs_tanggal_cluster;
DROP INDEX IF EXISTS idx_activity_logs_id_trans;
DROP INDEX IF EXISTS idx_activity_logs_region;
DROP INDEX IF EXISTS idx_activity_logs_province;
DROP INDEX IF EXISTS idx_activity_logs_token;
DROP INDEX IF EXISTS idx_activity_logs_nama;
DROP INDEX IF EXISTS idx_activity_logs_aktifitas;
DROP INDEX IF EXISTS idx_activity_logs_satker;
DROP INDEX IF EXISTS idx_activity_logs_cluster;
DROP INDEX IF EXISTS idx_activity_logs_tanggal;

-- Drop table
DROP TABLE IF EXISTS activity_logs CASCADE;

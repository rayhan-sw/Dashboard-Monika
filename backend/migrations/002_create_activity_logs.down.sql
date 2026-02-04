-- Migration Down: Drop act_log table
-- Version: 002
-- Date: 2026-01-27

-- Drop trigger
DROP TRIGGER IF EXISTS update_act_log_updated_at ON act_log;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_act_log_tanggal_aktifitas;
DROP INDEX IF EXISTS idx_act_log_satker_tanggal;
DROP INDEX IF EXISTS idx_act_log_tanggal_cluster;
DROP INDEX IF EXISTS idx_act_log_id_trans;
DROP INDEX IF EXISTS idx_act_log_region;
DROP INDEX IF EXISTS idx_act_log_province;
DROP INDEX IF EXISTS idx_act_log_token;
DROP INDEX IF EXISTS idx_act_log_nama;
DROP INDEX IF EXISTS idx_act_log_aktifitas;
DROP INDEX IF EXISTS idx_act_log_satker;
DROP INDEX IF EXISTS idx_act_log_cluster;
DROP INDEX IF EXISTS idx_act_log_tanggal;

-- Drop table
DROP TABLE IF EXISTS act_log CASCADE;

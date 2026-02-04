-- ==================================================
-- Database Creation Script for Dashboard BPK
-- ==================================================
-- Run this script in TWO STEPS:
-- 
-- STEP 1: Execute this in 'postgres' database (default connection)
--   Run ONLY the CREATE DATABASE line below
-- 
-- STEP 2: Switch to 'dashboard_bpk' database in DBeaver
--   Then run the rest of the script (CREATE TABLE, indexes, etc.)
-- ==================================================

-- STEP 1: Run this first in 'postgres' database
CREATE DATABASE daring_bpk
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- ==================================================
-- NOW SWITCH YOUR CONNECTION TO 'daring_bpk' DATABASE
-- In DBeaver: Right-click connection → Connect → Select 'daring_bpk'
-- Then execute the rest below
-- ==================================================

-- STEP 2: Create act_log table (run in 'daring_bpk')
CREATE TABLE IF NOT EXISTS act_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_trans UUID UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    satker VARCHAR(255),
    aktifitas VARCHAR(100) NOT NULL,
    scope TEXT,
    lokasi VARCHAR(255),
    cluster VARCHAR(50) NOT NULL,
    tanggal TIMESTAMPTZ NOT NULL,
    token UUID,
    province VARCHAR(100),
    region VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_act_log_tanggal ON act_log(tanggal);
CREATE INDEX IF NOT EXISTS idx_act_log_cluster ON act_log(cluster);
CREATE INDEX IF NOT EXISTS idx_act_log_satker ON act_log(satker);
CREATE INDEX IF NOT EXISTS idx_act_log_aktifitas ON act_log(aktifitas);
CREATE INDEX IF NOT EXISTS idx_act_log_nama ON act_log(nama);
CREATE INDEX IF NOT EXISTS idx_act_log_token ON act_log(token);
CREATE INDEX IF NOT EXISTS idx_act_log_province ON act_log(province);
CREATE INDEX IF NOT EXISTS idx_act_log_region ON act_log(region);
CREATE INDEX IF NOT EXISTS idx_act_log_id_trans ON act_log(id_trans);
CREATE INDEX IF NOT EXISTS idx_act_log_tanggal_cluster ON act_log(tanggal, cluster);
CREATE INDEX IF NOT EXISTS idx_act_log_tanggal_aktifitas ON act_log(tanggal, aktifitas);
CREATE INDEX IF NOT EXISTS idx_act_log_satker_tanggal ON act_log(satker, tanggal);

-- 5. Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger
DROP TRIGGER IF EXISTS update_act_log_updated_at ON act_log;
CREATE TRIGGER update_act_log_updated_at
    BEFORE UPDATE ON act_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verify setup
SELECT 'Database setup completed successfully!' AS status;
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_name = 'act_log';

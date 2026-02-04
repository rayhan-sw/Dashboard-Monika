-- Migration: Create act_log table for BIDICS monitoring
-- Description: Based on actLog CSV structure (idTrans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token)
-- Version: 002
-- Date: 2026-01-27

-- Drop existing table if needed (comment out if you want to keep data)
-- DROP TABLE IF EXISTS act_log CASCADE;

-- Create act_log table matching CSV structure
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

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_act_log_tanggal ON act_log(tanggal);
CREATE INDEX IF NOT EXISTS idx_act_log_cluster ON act_log(cluster);
CREATE INDEX IF NOT EXISTS idx_act_log_satker ON act_log(satker);
CREATE INDEX IF NOT EXISTS idx_act_log_aktifitas ON act_log(aktifitas);
CREATE INDEX IF NOT EXISTS idx_act_log_nama ON act_log(nama);
CREATE INDEX IF NOT EXISTS idx_act_log_token ON act_log(token);
CREATE INDEX IF NOT EXISTS idx_act_log_province ON act_log(province);
CREATE INDEX IF NOT EXISTS idx_act_log_region ON act_log(region);
CREATE INDEX IF NOT EXISTS idx_act_log_id_trans ON act_log(id_trans);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_act_log_tanggal_cluster ON act_log(tanggal, cluster);
CREATE INDEX IF NOT EXISTS idx_act_log_tanggal_aktifitas ON act_log(tanggal, aktifitas);
CREATE INDEX IF NOT EXISTS idx_act_log_satker_tanggal ON act_log(satker, tanggal);

-- Add comments for documentation
COMMENT ON TABLE act_log IS 'Stores user activity logs from BIDICS system imported from CSV';
COMMENT ON COLUMN act_log.id IS 'Auto-generated UUID primary key';
COMMENT ON COLUMN act_log.id_trans IS 'Transaction ID from CSV (idTrans) - UNIQUE';
COMMENT ON COLUMN act_log.nama IS 'Masked user name (e.g., i************)';
COMMENT ON COLUMN act_log.satker IS 'Organizational unit (satker/sub-auditorat)';
COMMENT ON COLUMN act_log.aktifitas IS 'Activity type (LOGIN, LOGOUT, View, Klik Pencarian Tunggal, etc.)';
COMMENT ON COLUMN act_log.scope IS 'Activity scope/details';
COMMENT ON COLUMN act_log.lokasi IS 'Location/section of activity';
COMMENT ON COLUMN act_log.cluster IS 'User cluster (pencarian, pemda, pusat)';
COMMENT ON COLUMN act_log.tanggal IS 'Activity timestamp';
COMMENT ON COLUMN act_log.token IS 'Session token';
COMMENT ON COLUMN act_log.province IS 'Extracted province from satker name';
COMMENT ON COLUMN act_log.region IS 'Grouped region (Sumatera, Jawa, Sulawesi, etc.)';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_act_log_updated_at ON act_log;
CREATE TRIGGER update_act_log_updated_at
    BEFORE UPDATE ON act_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create sample data insert (optional - comment out if not needed)
-- INSERT INTO act_log (id_trans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token)
-- VALUES 
-- ('8CA5592F-C0D3-48B9-8CDD-F935BE0900BC', 'i************', 'Subauditorat Sulawesi Utara I', 
--  'Klik Pencarian Tunggal', 'Tahun: 2023 Jenis: NTPN Search: 745FB868ITIRJKSV', 
--  'BTPN: Tab Pencarian Tunggal', 'pencarian', '2023-10-02 09:31:58+00', 
--  '7f221bb7-0f20-4ba4-8abe-f2e4f2657c66');


-- Migration: Create activity_logs table for BIDICS monitoring
-- Description: Based on actLog CSV structure (idTrans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token)
-- Version: 002
-- Date: 2026-01-27

-- Drop existing table if needed (comment out if you want to keep data)
-- DROP TABLE IF EXISTS activity_logs CASCADE;

-- Create activity_logs table matching CSV structure
CREATE TABLE IF NOT EXISTS activity_logs (
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
CREATE INDEX IF NOT EXISTS idx_activity_logs_tanggal ON activity_logs(tanggal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_cluster ON activity_logs(cluster);
CREATE INDEX IF NOT EXISTS idx_activity_logs_satker ON activity_logs(satker);
CREATE INDEX IF NOT EXISTS idx_activity_logs_aktifitas ON activity_logs(aktifitas);
CREATE INDEX IF NOT EXISTS idx_activity_logs_nama ON activity_logs(nama);
CREATE INDEX IF NOT EXISTS idx_activity_logs_token ON activity_logs(token);
CREATE INDEX IF NOT EXISTS idx_activity_logs_province ON activity_logs(province);
CREATE INDEX IF NOT EXISTS idx_activity_logs_region ON activity_logs(region);
CREATE INDEX IF NOT EXISTS idx_activity_logs_id_trans ON activity_logs(id_trans);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_tanggal_cluster ON activity_logs(tanggal, cluster);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tanggal_aktifitas ON activity_logs(tanggal, aktifitas);
CREATE INDEX IF NOT EXISTS idx_activity_logs_satker_tanggal ON activity_logs(satker, tanggal);

-- Add comments for documentation
COMMENT ON TABLE activity_logs IS 'Stores user activity logs from BIDICS system imported from CSV';
COMMENT ON COLUMN activity_logs.id IS 'Auto-generated UUID primary key';
COMMENT ON COLUMN activity_logs.id_trans IS 'Transaction ID from CSV (idTrans) - UNIQUE';
COMMENT ON COLUMN activity_logs.nama IS 'Masked user name (e.g., i************)';
COMMENT ON COLUMN activity_logs.satker IS 'Organizational unit (satker/sub-auditorat)';
COMMENT ON COLUMN activity_logs.aktifitas IS 'Activity type (LOGIN, LOGOUT, View, Klik Pencarian Tunggal, etc.)';
COMMENT ON COLUMN activity_logs.scope IS 'Activity scope/details';
COMMENT ON COLUMN activity_logs.lokasi IS 'Location/section of activity';
COMMENT ON COLUMN activity_logs.cluster IS 'User cluster (pencarian, pemda, pusat)';
COMMENT ON COLUMN activity_logs.tanggal IS 'Activity timestamp';
COMMENT ON COLUMN activity_logs.token IS 'Session token';
COMMENT ON COLUMN activity_logs.province IS 'Extracted province from satker name';
COMMENT ON COLUMN activity_logs.region IS 'Grouped region (Sumatera, Jawa, Sulawesi, etc.)';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON activity_logs;
CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create sample data insert (optional - comment out if not needed)
-- INSERT INTO activity_logs (id_trans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token)
-- VALUES 
-- ('8CA5592F-C0D3-48B9-8CDD-F935BE0900BC', 'i************', 'Subauditorat Sulawesi Utara I', 
--  'Klik Pencarian Tunggal', 'Tahun: 2023 Jenis: NTPN Search: 745FB868ITIRJKSV', 
--  'BTPN: Tab Pencarian Tunggal', 'pencarian', '2023-10-02 09:31:58+00', 
--  '7f221bb7-0f20-4ba4-8abe-f2e4f2657c66');

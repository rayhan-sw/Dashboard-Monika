-- Create activity_logs table in dashboard_bpk database
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_tanggal ON activity_logs(tanggal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_cluster ON activity_logs(cluster);
CREATE INDEX IF NOT EXISTS idx_activity_logs_satker ON activity_logs(satker);
CREATE INDEX IF NOT EXISTS idx_activity_logs_aktifitas ON activity_logs(aktifitas);
CREATE INDEX IF NOT EXISTS idx_activity_logs_nama ON activity_logs(nama);
CREATE INDEX IF NOT EXISTS idx_activity_logs_token ON activity_logs(token);
CREATE INDEX IF NOT EXISTS idx_activity_logs_province ON activity_logs(province);
CREATE INDEX IF NOT EXISTS idx_activity_logs_region ON activity_logs(region);
CREATE INDEX IF NOT EXISTS idx_activity_logs_id_trans ON activity_logs(id_trans);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tanggal_cluster ON activity_logs(tanggal, cluster);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tanggal_aktifitas ON activity_logs(tanggal, aktifitas);
CREATE INDEX IF NOT EXISTS idx_activity_logs_satker_tanggal ON activity_logs(satker, tanggal);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON activity_logs;
CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

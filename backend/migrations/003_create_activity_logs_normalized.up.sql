-- Migration 003: Create activity_logs_normalized table

CREATE TABLE IF NOT EXISTS activity_logs_normalized (
    id               BIGSERIAL PRIMARY KEY,
    id_trans         UUID NOT NULL UNIQUE,
    user_id          INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    satker_id        INTEGER REFERENCES ref_satker_units(id) ON DELETE SET NULL,
    activity_type_id INTEGER NOT NULL REFERENCES ref_activity_types(id) ON DELETE RESTRICT,
    cluster_id       INTEGER REFERENCES ref_clusters(id) ON DELETE SET NULL,
    location_id      INTEGER REFERENCES ref_locations(id) ON DELETE SET NULL,
    scope            TEXT,
    detail_aktifitas TEXT,
    status           VARCHAR(50) DEFAULT 'SUCCESS',
    tanggal          TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aln_tanggal       ON activity_logs_normalized(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_aln_user_id       ON activity_logs_normalized(user_id);
CREATE INDEX IF NOT EXISTS idx_aln_satker_id     ON activity_logs_normalized(satker_id);
CREATE INDEX IF NOT EXISTS idx_aln_cluster_id    ON activity_logs_normalized(cluster_id);
CREATE INDEX IF NOT EXISTS idx_aln_location_id   ON activity_logs_normalized(location_id);
CREATE INDEX IF NOT EXISTS idx_aln_activity_type ON activity_logs_normalized(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_aln_status        ON activity_logs_normalized(status);

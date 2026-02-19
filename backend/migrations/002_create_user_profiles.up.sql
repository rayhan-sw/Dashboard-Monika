-- Migration 002: Create user_profiles table

CREATE TABLE IF NOT EXISTS user_profiles (
    id             SERIAL PRIMARY KEY,
    nama           VARCHAR(255) NOT NULL,
    email          VARCHAR(255),
    token          VARCHAR(100),
    satker_id      INTEGER REFERENCES ref_satker_units(id) ON DELETE SET NULL,
    is_active      BOOLEAN DEFAULT true,
    first_activity TIMESTAMPTZ,
    last_activity  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_nama     ON user_profiles(nama);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email    ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_token    ON user_profiles(token);
CREATE INDEX IF NOT EXISTS idx_user_profiles_satker   ON user_profiles(satker_id);

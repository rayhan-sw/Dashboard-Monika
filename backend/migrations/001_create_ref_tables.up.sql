-- Migration 001: Create reference tables
-- ref_clusters, ref_activity_types, ref_locations, ref_satker_units

CREATE TABLE IF NOT EXISTS ref_clusters (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_cluster_name CHECK (name <> '')
);

CREATE TABLE IF NOT EXISTS ref_activity_types (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    VARCHAR(50),
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_activity_name CHECK (name <> '')
);

CREATE TABLE IF NOT EXISTS ref_locations (
    id            SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL UNIQUE,
    province      VARCHAR(100),
    location_type VARCHAR(50),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_location_name CHECK (location_name <> '')
);

CREATE TABLE IF NOT EXISTS ref_satker_units (
    id           SERIAL PRIMARY KEY,
    satker_name  VARCHAR(255) NOT NULL UNIQUE,
    eselon_level VARCHAR(50),
    parent_id    INTEGER REFERENCES ref_satker_units(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_satker_name CHECK (satker_name <> '')
);

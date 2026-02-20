-- Migration 006: Create ref_satker_units_normalized view
-- Convenience view that exposes ref_satker_units with a normalized name

CREATE OR REPLACE VIEW ref_satker_units_normalized AS
SELECT
    id,
    satker_name,
    eselon_level,
    parent_id,
    created_at,
    updated_at
FROM ref_satker_units;

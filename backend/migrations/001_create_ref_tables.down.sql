-- Migration 001 DOWN: Drop reference tables (in reverse dependency order)
DROP TABLE IF EXISTS ref_satker_units CASCADE;
DROP TABLE IF EXISTS ref_locations CASCADE;
DROP TABLE IF EXISTS ref_activity_types CASCADE;
DROP TABLE IF EXISTS ref_clusters CASCADE;

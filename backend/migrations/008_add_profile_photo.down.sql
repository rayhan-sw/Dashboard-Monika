-- Migration: Rollback add profile_photo and report_access_status
-- Version: 008
-- Date: 2026-02-12

ALTER TABLE users DROP COLUMN IF EXISTS profile_photo;
ALTER TABLE users DROP COLUMN IF EXISTS report_access_status;

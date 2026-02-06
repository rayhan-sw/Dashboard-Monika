-- Migration: Drop users table
-- Version: 005

DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_is_active;

DROP TABLE IF EXISTS users;

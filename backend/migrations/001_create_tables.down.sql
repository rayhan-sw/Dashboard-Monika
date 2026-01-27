-- Drop indexes
DROP INDEX IF EXISTS idx_activity_logs_timestamp;
DROP INDEX IF EXISTS idx_activity_logs_username;
DROP INDEX IF EXISTS idx_activity_logs_status;
DROP INDEX IF EXISTS idx_activity_logs_module;
DROP INDEX IF EXISTS idx_activity_logs_region;
DROP INDEX IF EXISTS idx_activity_logs_unit;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;

-- Drop tables
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS users;

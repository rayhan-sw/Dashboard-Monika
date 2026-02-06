-- Update password admin dengan hash yang benar
-- Password: admin123
-- Hash: $2a$10$7MyaMhqIImtLQ8Yzy5pGo.qW.NzRkRVf94Qw.dvlttmZPVR/uVqo2

UPDATE users 
SET password_hash = '$2a$10$7MyaMhqIImtLQ8Yzy5pGo.qW.NzRkRVf94Qw.dvlttmZPVR/uVqo2' 
WHERE username = 'admin';

-- Verify update
SELECT username, role, is_active, created_at 
FROM users 
WHERE username = 'admin';

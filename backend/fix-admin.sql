-- Delete and recreate admin user with correct password hash
DELETE FROM users WHERE username = 'admin';

-- Insert admin with correct bcrypt hash for 'admin123'
INSERT INTO users (username, password_hash, role, full_name, email, is_active)
VALUES (
    'admin',
    '$2a$10$7MyaMhqIImtLQ8Yzy5pGo.qW.NzRkRVf94Qw.dvlttmZPVR/uVqo2',
    'admin',
    'Administrator',
    'admin@bpk.go.id',
    true
);

-- Verify
SELECT 
    username, 
    role, 
    is_active,
    length(password_hash) as hash_length,
    substring(password_hash, 1, 10) as hash_start
FROM users 
WHERE username = 'admin';

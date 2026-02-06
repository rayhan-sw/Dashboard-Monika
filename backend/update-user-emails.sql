-- Update existing users with BPK email addresses
-- This script adds official @bpk.go.id email addresses to existing users

-- Update admin user email
UPDATE users 
SET email = 'admin@bpk.go.id', 
    updated_at = NOW()
WHERE username = 'admin';

-- Update yusrilganteng user email
UPDATE users 
SET email = 'yusrilganteng@bpk.go.id',
    updated_at = NOW()
WHERE username = 'yusrilganteng';

-- Verify the updates
SELECT id, username, email, role, full_name, is_active 
FROM users 
WHERE username IN ('admin', 'yusrilganteng')
ORDER BY username;

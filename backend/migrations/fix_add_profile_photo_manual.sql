-- Jalankan script ini di DBeaver (database daring_bpk) jika registrasi gagal
-- dengan error: column "profile_photo" of relation "users" does not exist
-- Cukup jalankan sekali.

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
COMMENT ON COLUMN users.profile_photo IS 'Base64 encoded profile photo or URL';

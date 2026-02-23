# ============================================
# SCRIPT: Migrate Missing Users from actlog to daring_bpk
# ============================================
# Fungsi: Copy user authentication yang hilang
# Author: GitHub Copilot
# Date: 2026-02-20
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MIGRASI USER DARI ACTLOG KE DARING_BPK   ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Database credentials
$DB_USER = "postgres"
$DB_PASS = "350327"
$DB_OLD = "actlog"
$DB_NEW = "daring_bpk"

# Export users dari actlog (kecuali admin yang sudah ada)
Write-Host "[1/4] Export users dari database actlog..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASS
$exportFile = ".\scripts\temp_users_export.sql"

# Generate SQL untuk copy users
psql -U $DB_USER -d $DB_OLD -c "
COPY (
  SELECT 
    username,
    password_hash,
    role,
    full_name,
    email,
    is_active,
    profile_photo,
    report_access_status,
    last_login,
    created_at,
    updated_at
  FROM users 
  WHERE username != 'admin'  -- Skip admin (sudah ada)
  ORDER BY id
) TO STDOUT WITH CSV HEADER
" > $exportFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Export berhasil" -ForegroundColor Green
} else {
    Write-Host "   ✗ Export gagal!" -ForegroundColor Red
    exit 1
}

# Count users yang akan dimigrate
$userCount = (Get-Content $exportFile | Measure-Object -Line).Lines - 1
Write-Host "   → Ditemukan $userCount user untuk dimigrate`n" -ForegroundColor Cyan

if ($userCount -eq 0) {
    Write-Host "   ⚠ Tidak ada user yang perlu dimigrate" -ForegroundColor Yellow
    Remove-Item $exportFile -ErrorAction SilentlyContinue
    exit 0
}

# Show users yang akan dimigrate
Write-Host "[2/4] User yang akan dimigrate:" -ForegroundColor Yellow
psql -U $DB_USER -d $DB_OLD -c "
SELECT username, email, role, created_at::date as created 
FROM users 
WHERE username != 'admin' 
ORDER BY id;
"
Write-Host ""

# Konfirmasi
Write-Host "Lanjutkan migrasi? (y/n): " -ForegroundColor Yellow -NoNewline
$confirm = Read-Host
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "`n   ✗ Migrasi dibatalkan" -ForegroundColor Red
    Remove-Item $exportFile -ErrorAction SilentlyContinue
    exit 0
}

# Import ke daring_bpk
Write-Host "`n[3/4] Import users ke database daring_bpk..." -ForegroundColor Yellow

# Create temp table untuk import
psql -U $DB_USER -d $DB_NEW -c "
-- Create temporary table
CREATE TEMP TABLE temp_users_import (
    username VARCHAR(50),
    password_hash VARCHAR(255),
    role VARCHAR(20),
    full_name VARCHAR(100),
    email VARCHAR(100),
    is_active BOOLEAN,
    profile_photo TEXT,
    report_access_status VARCHAR(20),
    last_login TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Copy from CSV
\COPY temp_users_import FROM '$exportFile' WITH CSV HEADER;

-- Insert into users table (skip duplicates)
INSERT INTO users (
    username, password_hash, role, full_name, email, 
    is_active, profile_photo, report_access_status, 
    last_login, created_at, updated_at
)
SELECT * FROM temp_users_import
WHERE username NOT IN (SELECT username FROM users)
  AND email NOT IN (SELECT email FROM users WHERE email IS NOT NULL);

-- Show results
SELECT 
    (SELECT COUNT(*) FROM temp_users_import) as total_to_import,
    (SELECT COUNT(*) FROM users WHERE username != 'admin') as total_imported;
"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Import berhasil`n" -ForegroundColor Green
} else {
    Write-Host "   ✗ Import gagal!" -ForegroundColor Red
    Remove-Item $exportFile -ErrorAction SilentlyContinue
    exit 1
}

# Verify
Write-Host "[4/4] Verifikasi hasil migrasi..." -ForegroundColor Yellow
psql -U $DB_USER -d $DB_NEW -c "
SELECT 
    id, 
    username, 
    email, 
    role, 
    created_at::date as created,
    last_login::date as last_login
FROM users 
ORDER BY id;
"

# Cleanup
Remove-Item $exportFile -ErrorAction SilentlyContinue

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        MIGRASI SELESAI DENGAN SUKSES       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Catatan:" -ForegroundColor Cyan
Write-Host "  • User yang sudah ada (username/email sama) akan di-skip" -ForegroundColor Gray
Write-Host "  • Password hash tetap sama (user bisa login dengan password lama)" -ForegroundColor Gray
Write-Host "  • Created_at dan last_login tetap preserved`n" -ForegroundColor Gray

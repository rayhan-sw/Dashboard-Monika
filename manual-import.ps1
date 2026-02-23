# Manual Import Data Script
# Jalankan ini di PowerShell baru jika script import-db.ps1 ada masalah

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MANUAL DATA IMPORT - DARING_BPK          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Set environment variables from .env
$env:PGPASSWORD = "350327"
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGUSER = "postgres"
$env:PGDATABASE = "daring_bpk"

$dumpFile = "$PSScriptRoot\backend\seeds\daring_bpk_data.dump"

if (-not (Test-Path $dumpFile)) {
    Write-Error "File dump tidak ditemukan: $dumpFile"
    exit 1
}

Write-Host "File dump: $dumpFile" -ForegroundColor Green
Write-Host "Database: daring_bpk" -ForegroundColor Green
Write-Host "`nMemulai import data...`n" -ForegroundColor Yellow

# Import data using pg_restore
pg_restore --data-only --no-owner --no-privileges --disable-triggers -d daring_bpk $dumpFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Import berhasil!" -ForegroundColor Green
} else {
    Write-Host "`nRetrying without --disable-triggers..." -ForegroundColor Yellow
    pg_restore --data-only --no-owner --no-privileges -d daring_bpk $dumpFile
}

Write-Host "`nVerifikasi data..." -ForegroundColor Cyan
psql -U postgres -d daring_bpk -c "SELECT 'activity_logs_normalized' as table_name, COUNT(*) as records FROM activity_logs_normalized UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'ref_satker_units', COUNT(*) FROM ref_satker_units UNION ALL SELECT 'ref_clusters', COUNT(*) FROM ref_clusters;"

Write-Host "`n✓ Proses import selesai!`n" -ForegroundColor Green

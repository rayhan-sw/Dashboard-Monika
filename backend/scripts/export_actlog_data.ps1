# Export act_log Data Script
# Description: Exports act_log table data to SQL file for team sharing
# Version: 1.0
# Date: 2026-01-31

param(
    [string]$DBName = "actlog",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [int]$DBPort = 5432,
    [string]$OutputFile = "..\seeds\actlog_data.sql"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Export act_log Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump is available
try {
    $null = Get-Command pg_dump -ErrorAction Stop
} catch {
    Write-Host "ERROR: PostgreSQL 'pg_dump' command not found!" -ForegroundColor Red
    Write-Host "Please add PostgreSQL bin directory to your PATH." -ForegroundColor Red
    Write-Host "Typical location: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use DBeaver or pgAdmin to export the data." -ForegroundColor Yellow
    exit 1
}

# Resolve output path
$OutputFile = Join-Path $PSScriptRoot $OutputFile
$OutputFile = [System.IO.Path]::GetFullPath($OutputFile)

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Database: $DBName" -ForegroundColor White
Write-Host "  Table: act_log" -ForegroundColor White
Write-Host "  Output: $OutputFile" -ForegroundColor White
Write-Host ""

# Export data
Write-Host "Exporting act_log data..." -ForegroundColor Yellow

pg_dump -U $DBUser -h $DBHost -p $DBPort -d $DBName -t act_log -a --column-inserts -f $OutputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Data exported successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Get file size
    $fileSize = (Get-Item $OutputFile).Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    
    if ($fileSizeMB -gt 1) {
        Write-Host "File size: $fileSizeMB MB" -ForegroundColor Cyan
    } else {
        Write-Host "File size: $fileSizeKB KB" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review the exported file: $OutputFile" -ForegroundColor White
    Write-Host "  2. Commit to Git: git add backend/seeds/actlog_data.sql" -ForegroundColor White
    Write-Host "  3. Share with your team via Git" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✗ Export failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Database doesn't exist" -ForegroundColor White
    Write-Host "  - Table 'act_log' not found" -ForegroundColor White
    Write-Host "  - Connection refused (check PostgreSQL is running)" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Import act_log Data Script
# Description: Imports act_log table data from seed file
# Version: 1.0
# Date: 2026-01-31

param(
    [string]$DBName = "actlog",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [int]$DBPort = 5432,
    [string]$InputFile = "..\seeds\actlog_data.sql"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Import act_log Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "ERROR: PostgreSQL 'psql' command not found!" -ForegroundColor Red
    Write-Host "Please add PostgreSQL bin directory to your PATH." -ForegroundColor Red
    Write-Host "Typical location: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Yellow
    exit 1
}

# Resolve input path
$InputFile = Join-Path $PSScriptRoot $InputFile
$InputFile = [System.IO.Path]::GetFullPath($InputFile)

# Check if file exists
if (-not (Test-Path $InputFile)) {
    Write-Host "ERROR: Input file not found: $InputFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure actlog_data.sql exists in backend/seeds/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Database: $DBName" -ForegroundColor White
Write-Host "  Input File: $InputFile" -ForegroundColor White
Write-Host ""

# Get file size
$fileSize = (Get-Item $InputFile).Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)
if ($fileSizeMB -gt 1) {
    Write-Host "File size: $fileSizeMB MB" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Importing data..." -ForegroundColor Yellow
Write-Host "This may take a while for large datasets..." -ForegroundColor Yellow
Write-Host ""

# Import data
$startTime = Get-Date
psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -f $InputFile

if ($LASTEXITCODE -eq 0) {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host ""
    Write-Host "✓ Data imported successfully!" -ForegroundColor Green
    Write-Host "Import took: $([math]::Round($duration, 2)) seconds" -ForegroundColor Cyan
    Write-Host ""
    
    # Get row count
    $rowCount = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT COUNT(*) FROM act_log;" 2>$null
    $rowCount = $rowCount.Trim()
    
    Write-Host "Total records in act_log: $rowCount" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Import failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Database doesn't exist (run setup_database.ps1 first)" -ForegroundColor White
    Write-Host "  - Table 'act_log' not created yet" -ForegroundColor White
    Write-Host "  - Duplicate key violations (data already exists)" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Script to export current PostgreSQL data for seeding
$ErrorActionPreference = "Stop"

Write-Host "=== Export Database Data for Seeding ===" -ForegroundColor Cyan

# Navigate to backend directory if not already there
$backendPath = Split-Path -Parent $PSScriptRoot
if (Test-Path (Join-Path $backendPath ".env")) {
    Set-Location $backendPath
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "Error: .env file not found" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Load database connection info from .env
$envContent = Get-Content ".env" -Raw
$dbHost = if ($envContent -match 'DB_HOST=([^\r\n]+)') { $matches[1].Trim() } else { "localhost" }
$dbPort = if ($envContent -match 'DB_PORT=([^\r\n]+)') { $matches[1].Trim() } else { "5432" }
$dbUser = if ($envContent -match 'DB_USER=([^\r\n]+)') { $matches[1].Trim() } else { "postgres" }
$dbPassword = if ($envContent -match 'DB_PASSWORD=([^\r\n]+)') { $matches[1].Trim() } else { "" }
$dbName = if ($envContent -match 'DB_NAME=([^\r\n]+)') { $matches[1].Trim() } else { "dashboard_bpk" }

Write-Host "Database: $dbName" -ForegroundColor Green
Write-Host "Host: $dbHost" -ForegroundColor Green
Write-Host "User: $dbUser" -ForegroundColor Green
Write-Host ""
Write-Host "Exporting activity_logs data using pg_dump..." -ForegroundColor Cyan

# Set password environment variable
$env:PGPASSWORD = $dbPassword

# Create seeds directory if not exists
if (-Not (Test-Path "seeds")) {
    New-Item -ItemType Directory -Path "seeds" -Force | Out-Null
}

$outputFile = "seeds\actlog_data_new.sql"

try {
    # Check if pg_dump is available
    $pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
    if (-Not $pgDumpPath) {
        Write-Host "Warning: pg_dump not found in PATH" -ForegroundColor Yellow
        Write-Host "Please install PostgreSQL and add bin directory to PATH" -ForegroundColor Yellow
        exit 1
    }
    
    # Export using pg_dump
    Write-Host "Running pg_dump..." -ForegroundColor Cyan
    & pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName --table=activity_logs --data-only --column-inserts --no-owner --no-privileges --file=$outputFile
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outputFile)) {
        $fileSize = (Get-Item $outputFile).Length / 1MB
        $lineCount = (Get-Content $outputFile | Measure-Object -Line).Lines
        
        Write-Host ""
        Write-Host "Success! Data exported" -ForegroundColor Green
        Write-Host "File: $outputFile" -ForegroundColor Green  
        Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host "Lines: $lineCount" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Review: $outputFile" -ForegroundColor White
        Write-Host "2. Replace old seed: Move-Item $outputFile seeds\actlog_data.sql -Force" -ForegroundColor Yellow
    } else {
        Write-Host "Error: Export failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan

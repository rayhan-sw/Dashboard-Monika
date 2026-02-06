# Update User Emails Script
# Updates admin and yusrilganteng with BPK email addresses

Write-Host "=== Update User Emails ===" -ForegroundColor Cyan
Write-Host ""

# Database credentials
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "actlog"
$DB_USER = "postgres"
# Password will be prompted by psql

# SQL file path
$SQL_FILE = Join-Path $PSScriptRoot "backend\update-user-emails.sql"

Write-Host "Checking SQL file..." -ForegroundColor Yellow
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "Error: SQL file not found at $SQL_FILE" -ForegroundColor Red
    exit 1
}
Write-Host "OK - SQL file found" -ForegroundColor Green
Write-Host ""

Write-Host "Updating user emails..." -ForegroundColor Yellow
Write-Host "You will be prompted for PostgreSQL password" -ForegroundColor Yellow
Write-Host ""

# Execute SQL file
$output = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SQL_FILE 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - User emails updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Updated users:" -ForegroundColor Cyan
    Write-Host $output
}
else {
    Write-Host "ERROR - Failed to update user emails" -ForegroundColor Red
    Write-Host $output
    exit 1
}

Write-Host ""
Write-Host "=== Update Complete ===" -ForegroundColor Cyan

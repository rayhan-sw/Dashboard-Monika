# Script untuk menjalankan database migration
# Usage: .\apply_migration.ps1

param(
    [string]$Host = "localhost",
    [string]$Port = "5432",
    [string]$Database = "daring_bpk",
    [string]$User = "postgres"
)

Write-Host "=== Database Migration Tool ===" -ForegroundColor Cyan
Write-Host ""

# Prompt untuk password
$SecurePassword = Read-Host "Enter PostgreSQL password for user '$User'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $Password

Write-Host ""
Write-Host "Connecting to database: $Database@$Host:$Port" -ForegroundColor Yellow
Write-Host ""

# Test connection
Write-Host "Testing connection..." -ForegroundColor Gray
$testQuery = "SELECT version();"
$testResult = & psql -h $Host -p $Port -U $User -d $Database -c $testQuery 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to connect to database!" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
    $env:PGPASSWORD = $null
    exit 1
}

Write-Host "✓ Connection successful!" -ForegroundColor Green
Write-Host ""

# Get migration files in order
$migrationPath = Join-Path $PSScriptRoot "..\migrations"
$upFiles = Get-ChildItem -Path $migrationPath -Filter "*.up.sql" | Sort-Object Name

Write-Host "Found $($upFiles.Count) migration files" -ForegroundColor Cyan
Write-Host ""

# Check if migrations table exists
Write-Host "Checking migrations table..." -ForegroundColor Gray
$checkTable = @"
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
"@

& psql -h $Host -p $Port -U $User -d $Database -c $checkTable | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create migrations table!" -ForegroundColor Red
    $env:PGPASSWORD = $null
    exit 1
}

# Apply each migration
$appliedCount = 0
foreach ($file in $upFiles) {
    $version = $file.Name -replace '\.up\.sql$', ''
    
    # Check if migration already applied
    $checkQuery = "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';"
    $result = & psql -h $Host -p $Port -U $User -d $Database -t -c $checkQuery
    
    if ($result -match '^\s*1\s*$') {
        Write-Host "⊘ Skipping $version (already applied)" -ForegroundColor DarkGray
        continue
    }
    
    Write-Host "→ Applying $version..." -ForegroundColor Yellow
    
    # Apply migration
    $sqlFile = $file.FullName
    $applyResult = & psql -h $Host -p $Port -U $User -d $Database -f $sqlFile 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to apply $version" -ForegroundColor Red
        Write-Host $applyResult -ForegroundColor Red
        $env:PGPASSWORD = $null
        exit 1
    }
    
    # Record migration
    $recordQuery = "INSERT INTO schema_migrations (version) VALUES ('$version');"
    & psql -h $Host -p $Port -U $User -d $Database -c $recordQuery | Out-Null
    
    Write-Host "✓ Successfully applied $version" -ForegroundColor Green
    $appliedCount++
}

Write-Host ""
if ($appliedCount -eq 0) {
    Write-Host "No new migrations to apply. Database is up to date!" -ForegroundColor Green
} else {
    Write-Host "Successfully applied $appliedCount migration(s)!" -ForegroundColor Green
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan

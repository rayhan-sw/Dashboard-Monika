# Database Setup Script for Dashboard BPK
# Description: Automated database setup with migrations and seed data
# Version: 1.0
# Date: 2026-01-31

param(
    [string]$DBName = "actlog",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [int]$DBPort = 5432
)

# Colors for output
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host ""
Write-Host "========================================" -ForegroundColor $ColorInfo
Write-Host "   Dashboard BPK - Database Setup" -ForegroundColor $ColorInfo
Write-Host "========================================" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "Configuration:" -ForegroundColor $ColorInfo
Write-Host "  Database: $DBName" -ForegroundColor White
Write-Host "  User: $DBUser" -ForegroundColor White
Write-Host "  Host: $DBHost" -ForegroundColor White
Write-Host "  Port: $DBPort" -ForegroundColor White
Write-Host ""

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "ERROR: PostgreSQL 'psql' command not found!" -ForegroundColor $ColorError
    Write-Host "Please add PostgreSQL bin directory to your PATH." -ForegroundColor $ColorError
    Write-Host "Typical location: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor $ColorWarning
    exit 1
}

# Step 1: Check if database exists
Write-Host "[1/6] Checking if database exists..." -ForegroundColor $ColorWarning
$dbExists = psql -U $DBUser -h $DBHost -p $DBPort -lqt | Select-String -Pattern "\s+$DBName\s+"

if ($dbExists) {
    Write-Host "      Database '$DBName' already exists!" -ForegroundColor $ColorWarning
    Write-Host ""
    $response = Read-Host "      Do you want to DROP and recreate it? This will DELETE all data! (yes/no)"
    
    if ($response -eq "yes") {
        Write-Host "      Dropping database..." -ForegroundColor $ColorError
        psql -U $DBUser -h $DBHost -p $DBPort -c "DROP DATABASE IF EXISTS $DBName;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "      ✓ Database dropped" -ForegroundColor $ColorSuccess
        } else {
            Write-Host "      ✗ Failed to drop database" -ForegroundColor $ColorError
            exit 1
        }
    } else {
        Write-Host "      Aborting setup." -ForegroundColor $ColorError
        exit 0
    }
}
Write-Host ""

# Step 2: Create Database
Write-Host "[2/6] Creating database '$DBName'..." -ForegroundColor $ColorWarning
psql -U $DBUser -h $DBHost -p $DBPort -c "CREATE DATABASE $DBName;" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ Database created successfully" -ForegroundColor $ColorSuccess
} else {
    Write-Host "      ✗ Failed to create database" -ForegroundColor $ColorError
    exit 1
}
Write-Host ""

# Step 3: Run Migrations (Schema)
Write-Host "[3/6] Running migrations (creating tables)..." -ForegroundColor $ColorWarning
$migrationFile = Join-Path $PSScriptRoot "..\migrations\001_create_tables.up.sql"

if (Test-Path $migrationFile) {
    psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -f $migrationFile -q
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      ✓ Tables and indexes created" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "      ✗ Migration failed" -ForegroundColor $ColorError
        exit 1
    }
} else {
    Write-Host "      ✗ Migration file not found: $migrationFile" -ForegroundColor $ColorError
    exit 1
}
Write-Host ""

# Step 4: Check for act_log table (from CSV import)
Write-Host "[4/6] Checking for act_log table..." -ForegroundColor $ColorWarning
$actLogExists = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'act_log');" 2>$null

if ($actLogExists -match "t") {
    Write-Host "      ✓ act_log table exists (from previous import)" -ForegroundColor $ColorSuccess
} else {
    Write-Host "      ⚠ act_log table not found" -ForegroundColor $ColorWarning
    Write-Host "      Note: You may need to import act_log data separately" -ForegroundColor $ColorWarning
}
Write-Host ""

# Step 5: Seed Data (Optional)
Write-Host "[5/6] Seeding data..." -ForegroundColor $ColorWarning
$seedFile = Join-Path $PSScriptRoot "..\seeds\initial_data.sql"

if (Test-Path $seedFile) {
    psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -f $seedFile -q
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      ✓ Seed data inserted" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "      ⚠ Seed data insertion had issues (may be normal if data exists)" -ForegroundColor $ColorWarning
    }
} else {
    Write-Host "      ⚠ Seed file not found: $seedFile (skipping)" -ForegroundColor $ColorWarning
    Write-Host "      This is optional - you can add seed data later" -ForegroundColor White
}
Write-Host ""

# Step 6: Verify Setup
Write-Host "[6/6] Verifying setup..." -ForegroundColor $ColorWarning

try {
    $tableCount = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    $tableCount = $tableCount.Trim()
    
    # Get list of tables
    $tables = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>$null
    
    Write-Host "      Tables created: $tableCount" -ForegroundColor $ColorInfo
    Write-Host ""
    Write-Host "      Table list:" -ForegroundColor $ColorInfo
    foreach ($table in $tables) {
        $table = $table.Trim()
        if ($table) {
            # Get row count for each table
            $rowCount = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT COUNT(*) FROM $table;" 2>$null
            $rowCount = $rowCount.Trim()
            Write-Host "        - $table ($rowCount rows)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "      ⚠ Could not verify all details" -ForegroundColor $ColorWarning
}

Write-Host ""
Write-Host "========================================" -ForegroundColor $ColorSuccess
Write-Host "   ✓ Database Setup Complete!" -ForegroundColor $ColorSuccess
Write-Host "========================================" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "Connection Information:" -ForegroundColor $ColorInfo
Write-Host "  Connection String: postgresql://$DBUser@$DBHost`:$DBPort/$DBName" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor $ColorInfo
Write-Host "  1. Update your .env file with database credentials" -ForegroundColor White
Write-Host "  2. If needed, import act_log data using import_actlog.ps1" -ForegroundColor White
Write-Host "  3. Run the backend API: cd backend/cmd/api && ./run.ps1" -ForegroundColor White
Write-Host ""

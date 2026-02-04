# Database Setup Script for Dashboard BPK
# Description: Automated database setup with migrations and seed data
# Version: 2.0
# Date: 2026-02-01

param(
    [string]$DBName = "dashboard_bpk",
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
Write-Host "[1/7] Checking if database exists..." -ForegroundColor $ColorWarning
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
Write-Host "[2/7] Creating database '$DBName'..." -ForegroundColor $ColorWarning
psql -U $DBUser -h $DBHost -p $DBPort -c "CREATE DATABASE $DBName;" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ Database created successfully" -ForegroundColor $ColorSuccess
} else {
    Write-Host "      ✗ Failed to create database" -ForegroundColor $ColorError
    exit 1
}
Write-Host ""

# Step 3: Run Migrations
Write-Host "[3/7] Running migrations..." -ForegroundColor $ColorWarning
$migrationsDir = Join-Path $PSScriptRoot "..\migrations"
$migrationFiles = @(
    "002_create_activity_logs.up.sql",
    "003_add_email_eselon.up.sql", 
    "004_add_status_detail.up.sql"
)

$migrationSuccess = $true
foreach ($migFile in $migrationFiles) {
    $migPath = Join-Path $migrationsDir $migFile
    
    if (Test-Path $migPath) {
        Write-Host "      Running: $migFile" -ForegroundColor White
        psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -f $migPath -q
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "      ✓ $migFile applied" -ForegroundColor $ColorSuccess
        } else {
            Write-Host "      ✗ $migFile failed" -ForegroundColor $ColorError
            $migrationSuccess = $false
            break
        }
    } else {
        Write-Host "      ⚠ Migration file not found: $migFile" -ForegroundColor $ColorWarning
    }
}

if (-not $migrationSuccess) {
    Write-Host "      Migration failed. Exiting..." -ForegroundColor $ColorError
    exit 1
}
Write-Host ""

# Step 4: Seed Data from actlog_data.sql
Write-Host "[4/7] Seeding act_log data..." -ForegroundColor $ColorWarning
$seedFile = Join-Path $PSScriptRoot "..\seeds\actlog_data.sql"

# Step 4: Seed Data from actlog_data.sql
Write-Host "[4/7] Seeding act_log data..." -ForegroundColor $ColorWarning
$seedFile = Join-Path $PSScriptRoot "..\seeds\actlog_data.sql"

if (Test-Path $seedFile) {
    Write-Host "      Loading seed file..." -ForegroundColor White
    Write-Host "      (This may take a few minutes for large datasets)" -ForegroundColor White
    
    # Get file size for info
    $fileSize = (Get-Item $seedFile).Length / 1MB
    Write-Host "      File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    
    $startTime = Get-Date
    psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -f $seedFile -q 2>&1 | Out-Null
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      ✓ Seed data inserted ($([math]::Round($duration, 2))s)" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "      ⚠ Seed data insertion had issues" -ForegroundColor $ColorWarning
        Write-Host "      Check if the file format is correct" -ForegroundColor $ColorWarning
    }
} else {
    Write-Host "      ⚠ Seed file not found: actlog_data.sql" -ForegroundColor $ColorWarning
    Write-Host "      You can export current data using:" -ForegroundColor White
    Write-Host "      .\scripts\export_current_data.ps1" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Check act_log table
Write-Host "[5/7] Checking act_log table..." -ForegroundColor $ColorWarning
$activityLogsExists = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'act_log');" 2>$null

if ($activityLogsExists -match "t") {
    $rowCount = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT COUNT(*) FROM act_log;" 2>$null
    $rowCount = $rowCount.Trim()
    Write-Host "      ✓ act_log table exists with $rowCount rows" -ForegroundColor $ColorSuccess
} else {
    Write-Host "      ✗ act_log table not found (migration may have failed)" -ForegroundColor $ColorError
}
Write-Host ""

# Step 6: Verify Columns
Write-Host "[6/7] Verifying table structure..." -ForegroundColor $ColorWarning
try {
    $columns = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'act_log' ORDER BY ordinal_position;" 2>$null
    $columnList = @()
    foreach ($col in $columns) {
        $col = $col.Trim()
        if ($col) {
            $columnList += $col
        }
    }
    
    Write-Host "      Columns: $($columnList.Count)" -ForegroundColor White
    $expectedCols = @("id", "id_trans", "nama", "satker", "aktifitas", "scope", "lokasi", "cluster", "tanggal", "token", "status", "detail_aktifitas", "province", "region", "created_at", "updated_at")
    
    $missingCols = @()
    foreach ($expected in $expectedCols) {
        if ($columnList -notcontains $expected) {
            $missingCols += $expected
        }
    }
    
    if ($missingCols.Count -eq 0) {
        Write-Host "      ✓ All expected columns present" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "      ⚠ Missing columns: $($missingCols -join ', ')" -ForegroundColor $ColorWarning
    }
} catch {
    Write-Host "      ⚠ Could not verify columns" -ForegroundColor $ColorWarning
}
Write-Host ""

# Step 7: Verify Setup
Write-Host "[7/7] Final verification..." -ForegroundColor $ColorWarning

# Step 7: Verify Setup
Write-Host "[7/7] Final verification..." -ForegroundColor $ColorWarning

try {
    $tableCount = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    $tableCount = $tableCount.Trim()
    
    # Get list of tables with row counts
    $tables = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>$null
    
    Write-Host "      Tables created: $tableCount" -ForegroundColor $ColorInfo
    Write-Host ""
    Write-Host "      Table details:" -ForegroundColor $ColorInfo
    foreach ($table in $tables) {
        $table = $table.Trim()
        if ($table) {
            $rowCount = psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -t -c "SELECT COUNT(*) FROM $table;" 2>$null
            $rowCount = $rowCount.Trim()
            Write-Host "        - $table : $rowCount rows" -ForegroundColor White
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
Write-Host "  Database: $DBName" -ForegroundColor White
Write-Host "  Connection String: postgresql://$DBUser@$DBHost`:$DBPort/$DBName" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor $ColorInfo
Write-Host "  1. Verify your .env file has correct database credentials" -ForegroundColor White
Write-Host "     DB_NAME=$DBName" -ForegroundColor Yellow
Write-Host "  2. Test backend connection:" -ForegroundColor White
Write-Host "     cd backend && .\test-db-connection.ps1" -ForegroundColor Yellow
Write-Host "  3. Start the backend API:" -ForegroundColor White
Write-Host "     cd backend\cmd\api && .\run.ps1" -ForegroundColor Yellow
Write-Host "  4. Start the frontend:" -ForegroundColor White
Write-Host "     cd frontend && npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "For data sync workflow, see: DATABASE_SYNC_WORKFLOW.md" -ForegroundColor $ColorInfo
Write-Host ""

# Quick Database Verification Script
$ErrorActionPreference = "Stop"

Write-Host "=== Database Verification ===" -ForegroundColor Cyan

# Navigate to backend directory
$backendPath = "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
}

# Load .env
if (-Not (Test-Path ".env")) {
    Write-Host "Error: .env file not found in backend directory" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env" -Raw
$dbHost = if ($envContent -match 'DB_HOST=([^\r\n]+)') { $matches[1].Trim() } else { "localhost" }
$dbPort = if ($envContent -match 'DB_PORT=([^\r\n]+)') { $matches[1].Trim() } else { "5432" }
$dbUser = if ($envContent -match 'DB_USER=([^\r\n]+)') { $matches[1].Trim() } else { "postgres" }
$dbPassword = if ($envContent -match 'DB_PASSWORD=([^\r\n]+)') { $matches[1].Trim() } else { "" }
$dbName = if ($envContent -match 'DB_NAME=([^\r\n]+)') { $matches[1].Trim() } else { "dashboard_bpk" }

# Set password
$env:PGPASSWORD = $dbPassword

Write-Host "Database: $dbName" -ForegroundColor Green
Write-Host "Host: $dbHost" -ForegroundColor Green
Write-Host ""

# Check 1: Total Rows
Write-Host "[1/5] Checking total rows..." -ForegroundColor Yellow
try {
    $rowCount = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c "SELECT COUNT(*) FROM act_log;" 2>$null
    $rowCount = $rowCount.Trim()
    
    if ($rowCount -eq "72034") {
        Write-Host "[OK] Total rows: $rowCount (CORRECT)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Total rows: $rowCount (Expected: 72034)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check row count" -ForegroundColor Red
}

# Check 2: Clusters
Write-Host "`n[2/5] Checking clusters..." -ForegroundColor Yellow
try {
    $clusters = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c "SELECT COUNT(DISTINCT cluster) FROM act_log;" 2>$null
    $clusters = $clusters.Trim()
    
    if ($clusters -eq "13") {
        Write-Host "[OK] Total clusters: $clusters (CORRECT)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Total clusters: $clusters (Expected: 13)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check clusters" -ForegroundColor Red
}

# Check 3: Columns
Write-Host "`n[3/5] Checking columns..." -ForegroundColor Yellow
try {
    $columns = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'act_log';" 2>$null
    $columns = $columns.Trim()
    
    if ($columns -eq "18") {
        Write-Host "[OK] Total columns: $columns (CORRECT)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Total columns: $columns (Expected: 18)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check columns" -ForegroundColor Red
}

# Check 4: Date Range
Write-Host "`n[4/5] Checking date range..." -ForegroundColor Yellow
try {
    psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -c "SELECT MIN(tanggal) as earliest, MAX(tanggal) as latest FROM act_log;" 2>$null
} catch {
    Write-Host "[ERROR] Failed to check date range" -ForegroundColor Red
}

# Check 5: Cluster Distribution
Write-Host "`n[5/5] Cluster distribution..." -ForegroundColor Yellow
try {
    psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -c "SELECT cluster, COUNT(*) as total FROM act_log GROUP BY cluster ORDER BY total DESC;" 2>$null
} catch {
    Write-Host "[ERROR] Failed to check cluster distribution" -ForegroundColor Red
}

Write-Host "`n=== Verification Completed ===" -ForegroundColor Cyan
Write-Host "Expected values:" -ForegroundColor White
Write-Host "- Total rows: 72,034" -ForegroundColor White
Write-Host "- Clusters: 13" -ForegroundColor White
Write-Host "- Columns: 18" -ForegroundColor White
Write-Host "`nIf values don't match, check VERIFY_DATA.md for troubleshooting" -ForegroundColor Yellow

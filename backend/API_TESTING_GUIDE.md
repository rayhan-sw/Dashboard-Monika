# API Testing Guide

## Quick Test Script (PowerShell)

Save this as `test-api.ps1` in backend folder:

```powershell
# API Testing Script for Dashboard BPK
$baseUrl = "http://localhost:8080"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Dashboard BPK API Tests" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1] Health Check..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "  Status: $($response.status)" -ForegroundColor Green
Write-Host "  Service: $($response.service)" -ForegroundColor Green
Write-Host ""

# Test 2: Dashboard Stats
Write-Host "[2] Dashboard Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/stats" -Method Get
    Write-Host "  Total Users: $($stats.total_users)" -ForegroundColor Green
    Write-Host "  Success Logins: $($stats.success_logins)" -ForegroundColor Green
    Write-Host "  Total Activities: $($stats.total_activities)" -ForegroundColor Green
    Write-Host "  Logout Errors: $($stats.logout_errors)" -ForegroundColor Green
    Write-Host "  Busiest Hour: $($stats.busiest_hour.hour):00 - $($stats.busiest_hour.hour + 1):00 ($($stats.busiest_hour.count) activities)" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Recent Activities
Write-Host "[3] Recent Activities (page 1, 5 items)..." -ForegroundColor Yellow
try {
    $activities = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/activities?page=1&page_size=5" -Method Get
    Write-Host "  Total Records: $($activities.total)" -ForegroundColor Green
    Write-Host "  Total Pages: $($activities.total_pages)" -ForegroundColor Green
    Write-Host "  Showing $($activities.data.Count) activities:" -ForegroundColor Green
    foreach ($activity in $activities.data) {
        Write-Host "    - $($activity.nama) | $($activity.aktifitas) | $($activity.tanggal)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Hourly Chart Data
Write-Host "[4] Hourly Activity Chart..." -ForegroundColor Yellow
try {
    $hourly = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/charts/hourly" -Method Get
    Write-Host "  Hours with activity: $($hourly.data.Count)" -ForegroundColor Green
    $topHours = $hourly.data | Sort-Object -Property count -Descending | Select-Object -First 3
    Write-Host "  Top 3 busiest hours:" -ForegroundColor Green
    foreach ($hour in $topHours) {
        Write-Host "    - Hour $($hour.hour):00 = $($hour.count) activities" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Cluster Chart Data
Write-Host "[5] Cluster Activity Chart..." -ForegroundColor Yellow
try {
    $cluster = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/charts/cluster" -Method Get
    Write-Host "  Clusters found:" -ForegroundColor Green
    foreach ($key in $cluster.data.PSObject.Properties.Name) {
        Write-Host "    - $key = $($cluster.data.$key) activities" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Province Chart Data
Write-Host "[6] Province Activity Chart..." -ForegroundColor Yellow
try {
    $province = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/charts/province" -Method Get
    Write-Host "  Provinces: $($province.data.Count)" -ForegroundColor Green
    $topProvince = $province.data | Sort-Object -Property count -Descending | Select-Object -First 5
    foreach ($prov in $topProvince) {
        Write-Host "    - $($prov.province) = $($prov.count) activities" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Access Success Rate
Write-Host "[7] Access Success Rate (last 7 days)..." -ForegroundColor Yellow
try {
    $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $success = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/access-success?start_date=$startDate&end_date=$endDate" -Method Get
    Write-Host "  Days with data: $($success.data.Count)" -ForegroundColor Green
    foreach ($day in $success.data) {
        Write-Host "    - $($day.date): Success=$($day.success) Failed=$($day.failed) Rate=$([math]::Round($day.success_rate, 2))%" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Provincial Data
Write-Host "[8] Regional - Provinces..." -ForegroundColor Yellow
try {
    $provinces = Invoke-RestMethod -Uri "$baseUrl/api/regional/provinces" -Method Get
    Write-Host "  Total Provinces: $($provinces.data.Count)" -ForegroundColor Green
    $topProvinces = $provinces.data | Sort-Object -Property count -Descending | Select-Object -First 5
    Write-Host "  Top 5 provinces:" -ForegroundColor Green
    foreach ($prov in $topProvinces) {
        Write-Host "    - $($prov.province): $($prov.count) activities" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: Unit/Satker Data
Write-Host "[9] Regional - Units (Top 10)..." -ForegroundColor Yellow
try {
    $units = Invoke-RestMethod -Uri "$baseUrl/api/regional/units?page=1&page_size=10" -Method Get
    Write-Host "  Total Pages: $($units.total_pages)" -ForegroundColor Green
    Write-Host "  Top 10 units:" -ForegroundColor Green
    foreach ($unit in $units.data) {
        Write-Host "    #$($unit.rank) - $($unit.satker): $($unit.count) activities" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  All Tests Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
```

## Usage

1. **Start the server**:

   ```powershell
   cd backend
   .\bin\server.exe
   ```

2. **Run tests** (in another terminal):
   ```powershell
   cd backend
   .\test-api.ps1
   ```

---

## Manual Testing with curl

### Health Check

```bash
curl http://localhost:8080/health
```

### Dashboard Statistics

```bash
curl http://localhost:8080/api/dashboard/stats
```

### Recent Activities (Paginated)

```bash
# First page, 10 items
curl "http://localhost:8080/api/dashboard/activities?page=1&page_size=10"

# Second page
curl "http://localhost:8080/api/dashboard/activities?page=2&page_size=10"
```

### Hourly Activity Chart

```bash
curl http://localhost:8080/api/dashboard/charts/hourly
```

### Cluster Distribution

```bash
curl http://localhost:8080/api/dashboard/charts/cluster
```

### Province Distribution

```bash
curl http://localhost:8080/api/dashboard/charts/province
```

### Access Success Rate (Date Range)

```bash
curl "http://localhost:8080/api/dashboard/access-success?start_date=2025-01-01&end_date=2025-01-09"
```

### Regional - Provinces

```bash
curl http://localhost:8080/api/regional/provinces
```

### Regional - Units (Paginated)

```bash
curl "http://localhost:8080/api/regional/units?page=1&page_size=20"
```

---

## Expected Response Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Database or server error

---

## Troubleshooting

### Error: "Failed to connect to database"

- Make sure PostgreSQL is running
- Verify `.env` file has correct DB_PASSWORD (12345678)
- Check database "dashboard_bpk" exists

### Error: "Empty response"

- Database might be empty
- Run CSV import script first:
  ```powershell
  go run cmd/import/main.go "../path/to/actLog.csv"
  ```

### Port already in use

- Change PORT in `.env` file
- Or kill process using port 8080:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process
  ```

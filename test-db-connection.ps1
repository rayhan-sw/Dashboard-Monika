# Test Database Connection
Write-Host "`n=== TESTING DATABASE CONNECTION ===" -ForegroundColor Cyan

# Test Health Endpoint
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method GET
    Write-Host "   ✓ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✓ Service: $($health.service)" -ForegroundColor Green
    Write-Host "   ✓ Version: $($health.version)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed: $_" -ForegroundColor Red
}

# Test Dashboard Stats
Write-Host "`n2. Testing Dashboard Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:8080/api/dashboard/stats" -Method GET
    Write-Host "   ✓ Total Users: $($stats.totalUsers)" -ForegroundColor Green
    Write-Host "   ✓ Success Logins: $($stats.successLogins)" -ForegroundColor Green
    Write-Host "   ✓ Total Activity: $($stats.totalActivity)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed: $_" -ForegroundColor Red
}

# Test Activities
Write-Host "`n3. Testing Activities..." -ForegroundColor Yellow
try {
    $activities = Invoke-RestMethod -Uri "http://localhost:8080/api/dashboard/activities" -Method GET
    Write-Host "   ✓ Fetched $($activities.Count) activities" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed: $_" -ForegroundColor Red
}

# Test Provinces
Write-Host "`n4. Testing Provinces..." -ForegroundColor Yellow
try {
    $provinces = Invoke-RestMethod -Uri "http://localhost:8080/api/regional/provinces" -Method GET
    Write-Host "   ✓ Fetched $($provinces.Count) provinces" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed: $_" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""

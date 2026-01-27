# Test API Endpoints

$baseUrl = "http://localhost:8080"

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      DASHBOARD BPK - API TESTING           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing
        Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
        $json = $response.Content | ConvertFrom-Json
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host ($json | ConvertTo-Json -Depth 3) -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Test Health
Test-Endpoint -Name "Health Check" -Url "$baseUrl/health"

# Test Dashboard Stats
Test-Endpoint -Name "Dashboard Stats" -Url "$baseUrl/api/dashboard/stats"

# Test Activities
Test-Endpoint -Name "Recent Activities" -Url "$baseUrl/api/dashboard/activities"

# Test Charts
Test-Endpoint -Name "Interaction Chart" -Url "$baseUrl/api/dashboard/charts/interaction"
Test-Endpoint -Name "Hourly Chart" -Url "$baseUrl/api/dashboard/charts/hourly"

# Test Regional
Test-Endpoint -Name "Provinces" -Url "$baseUrl/api/regional/provinces"
Test-Endpoint -Name "Units" -Url "$baseUrl/api/regional/units"

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ API Testing Complete!" -ForegroundColor Green

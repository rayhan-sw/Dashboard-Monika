# Quick Start Script - Dashboard BPK
# Run both servers automatically

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    DASHBOARD BPK - QUICK START             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$projectRoot = "c:\Users\Rayhansw\KULIAH\MagangBPK\Dashboard-BPK"

# Check if PostgreSQL is running
Write-Host "🔍 Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgCheck = & psql -U postgres -d dashboard_bpk -c "SELECT 1;" 2>&1
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL might not be running or database not created" -ForegroundColor Red
    Write-Host "   Run: createdb dashboard_bpk" -ForegroundColor Yellow
}

Write-Host "`n🚀 Starting Backend Server (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Green; go run cmd/api/main.go"

Write-Host "⏳ Waiting 3 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n🚀 Starting Frontend Server (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host '🎨 FRONTEND SERVER' -ForegroundColor Green; npm run dev"

Write-Host "`n⏳ Waiting 5 seconds for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n✅ SERVERS STARTED!" -ForegroundColor Green
Write-Host "`n📍 Access Points:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   🔌 Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "   💚 Health:    http://localhost:8080/health" -ForegroundColor White

Write-Host "`n🧪 Testing Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing
    Write-Host "✓ Backend Health Check: OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not responding yet, might still be starting..." -ForegroundColor Yellow
}

Write-Host "`n📝 Quick Commands:" -ForegroundColor Cyan
Write-Host "   • Stop Servers: Close the PowerShell windows" -ForegroundColor Gray
Write-Host "   • View Logs: Check the PowerShell terminal windows" -ForegroundColor Gray
Write-Host "   • Restart: Close windows and run this script again" -ForegroundColor Gray

Write-Host "`n🎉 Happy Coding!" -ForegroundColor Green
Write-Host "Press any key to open browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"

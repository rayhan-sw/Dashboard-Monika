# Stop All Development Servers

Write-Host "`n🛑 Stopping Development Servers..." -ForegroundColor Red

# Stop Node processes (Frontend)
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "   Stopping Frontend (PID: $($_.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force
}

# Stop Go processes (Backend)
Get-Process | Where-Object { $_.ProcessName -like "*go*" -or $_.MainWindowTitle -like "*Dashboard*" } | ForEach-Object {
    Write-Host "   Stopping Backend (PID: $($_.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "`n✓ All servers stopped!" -ForegroundColor Green
Write-Host "   Run start-dev.ps1 to restart" -ForegroundColor Gray

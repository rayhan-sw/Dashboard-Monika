# Restart Backend Server Script

Write-Host "🔄 Stopping backend server..." -ForegroundColor Yellow

# Kill Go processes related to backend
Get-Process | Where-Object {$_.ProcessName -eq "go" -or $_.Path -like "*backend*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "✅ Backend stopped" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan

# Navigate to backend directory and start server
Set-Location -Path "$PSScriptRoot\backend"
go run cmd/api/main.go

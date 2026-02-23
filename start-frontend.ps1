# Quick Start Frontend - Dashboard BPK
# Jalankan ini jika npm run dev lambat

Write-Host "`n🚀 Starting Frontend Development Server..." -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

Set-Location -Path "$PSScriptRoot\frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠ node_modules tidak ditemukan. Menjalankan npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n✗ npm install gagal!`n" -ForegroundColor Red
        exit 1
    }
}

# Clean cache jika ada masalah
if ($args -contains "--clean") {
    Write-Host "🧹 Membersihkan cache..." -ForegroundColor Yellow
    if (Test-Path ".next") { Remove-Item -Recurse -Force .next }
    Write-Host "✓ Cache dibersihkan`n" -ForegroundColor Green
}

Write-Host "Frontend akan start di: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8080`n" -ForegroundColor Green
Write-Host "Tekan Ctrl+C untuk stop`n" -ForegroundColor Gray

# Start dev server
npm run dev

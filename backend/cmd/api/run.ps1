#!/usr/bin/env pwsh
# Script sederhana untuk run backend server
# Cukup ketik: .\run.ps1

Set-Location -Path "$PSScriptRoot\..\.."
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
go run ./cmd/api/main.go

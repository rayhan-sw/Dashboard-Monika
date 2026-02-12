# Quick Migration Script
# Shortcut untuk apply migration dengan setting default

Write-Host "=== Quick Database Migration ===" -ForegroundColor Cyan
Write-Host ""

# Prompt password saja
$SecurePassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set default values
$env:PGPASSWORD = $Password
$Host = "localhost"
$Port = "5432"
$Database = "daring_bpk"
$User = "postgres"

Write-Host "Applying migrations to $Database..." -ForegroundColor Yellow
Write-Host ""

# Run the full migration script
& "$PSScriptRoot\apply_migration.ps1" -Host $Host -Port $Port -Database $Database -User $User

$env:PGPASSWORD = $null

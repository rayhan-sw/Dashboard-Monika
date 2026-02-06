# Test Auth Endpoints - PowerShell Script
# Script untuk testing authentication endpoints

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  TESTING AUTH ENDPOINTS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080/api/auth"

# 1. Test Register
Write-Host "`n[1] Testing Register Endpoint..." -ForegroundColor Yellow
try {
    $registerBody = @{
        username = "yusril"
        password = "yusril123"
        confirm_password = "yusril123"
        full_name = "Yusril Developer"
        email = "yusril@bpk.go.id"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop

    Write-Host "✓ Register Success!" -ForegroundColor Green
    Write-Host "Response: $($registerResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Register Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# 2. Test Login
Write-Host "`n[2] Testing Login Endpoint..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "yusril"
        password = "yusril123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    Write-Host "✓ Login Success!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token)" -ForegroundColor Gray
    Write-Host "User: $($loginResponse.user.username) ($($loginResponse.user.role))" -ForegroundColor Gray

    # Save token for later use
    $token = $loginResponse.token
} catch {
    Write-Host "✗ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# 3. Test Login with Admin
Write-Host "`n[3] Testing Admin Login..." -ForegroundColor Yellow
try {
    $adminLoginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $adminLoginResponse = Invoke-RestMethod -Uri "$baseUrl/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $adminLoginBody `
        -ErrorAction Stop

    Write-Host "✓ Admin Login Success!" -ForegroundColor Green
    Write-Host "User: $($adminLoginResponse.user.username) ($($adminLoginResponse.user.role))" -ForegroundColor Gray
} catch {
    Write-Host "✗ Admin Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# 4. Test Forgot Password
Write-Host "`n[4] Testing Forgot Password Endpoint..." -ForegroundColor Yellow
try {
    $forgotBody = @{
        username = "yusril"
        new_password = "newpass123"
        confirm_password = "newpass123"
    } | ConvertTo-Json

    $forgotResponse = Invoke-RestMethod -Uri "$baseUrl/forgot-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $forgotBody `
        -ErrorAction Stop

    Write-Host "✓ Password Reset Success!" -ForegroundColor Green
    Write-Host "Response: $($forgotResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Password Reset Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# 5. Test Login with New Password
Write-Host "`n[5] Testing Login with New Password..." -ForegroundColor Yellow
try {
    $newLoginBody = @{
        username = "yusril"
        password = "newpass123"
    } | ConvertTo-Json

    $newLoginResponse = Invoke-RestMethod -Uri "$baseUrl/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $newLoginBody `
        -ErrorAction Stop

    Write-Host "✓ Login with New Password Success!" -ForegroundColor Green
    Write-Host "User: $($newLoginResponse.user.username)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# 6. Test Invalid Login
Write-Host "`n[6] Testing Invalid Login (should fail)..." -ForegroundColor Yellow
try {
    $invalidBody = @{
        username = "yusril"
        password = "wrongpassword"
    } | ConvertTo-Json

    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $invalidBody `
        -ErrorAction Stop

    Write-Host "✗ Should have failed!" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected invalid credentials" -ForegroundColor Green
    if ($_.ErrorDetails) {
        Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Authentication System Setup Guide

## 🔐 Sistem Autentikasi MONIKA

Sistem autentikasi lengkap untuk Dashboard BPK dengan 3 halaman utama:

1. **Login** (`/login`) - Halaman login untuk user dan admin
2. **Forgot Password** (`/forgot-password`) - Reset password
3. **Register** (`/register`) - Buat akun baru

---

## 📦 Yang Sudah Dibuat

### Backend (Go)

#### 1. Database Migration
- **File**: `backend/migrations/005_create_users_table.up.sql`
- **Table**: `users`
- **Columns**:
  - `id` - Primary key
  - `username` - Unique username
  - `password_hash` - Encrypted password (bcrypt)
  - `role` - User role (`user` atau `admin`)
  - `full_name` - Nama lengkap (optional)
  - `email` - Email (optional)
  - `is_active` - Status aktif akun
  - `created_at`, `updated_at`, `last_login` - Timestamps

- **Default Admin Account**:
  - Username: `admin`
  - Password: `admin123`
  - Role: `admin`

#### 2. Entity (Models)
- **File**: `backend/internal/entity/user.go`
- **Structs**:
  - `User` - Model database user
  - `LoginRequest` - Request body untuk login
  - `RegisterRequest` - Request body untuk register
  - `ForgotPasswordRequest` - Request body untuk reset password
  - `LoginResponse` - Response data login

#### 3. Handlers (Controllers)
- **File**: `backend/internal/handler/auth_handler.go`
- **Functions**:
  - `Login()` - Handle login (POST `/api/auth/login`)
  - `Register()` - Handle register (POST `/api/auth/register`)
  - `ForgotPassword()` - Handle reset password (POST `/api/auth/forgot-password`)
  - `Logout()` - Handle logout (POST `/api/auth/logout`)

#### 4. Middleware
- **File**: `backend/internal/middleware/auth.go`
- **Functions**:
  - `AuthMiddleware()` - Validasi token authentication
  - `AdminMiddleware()` - Validasi role admin
  - `CORSMiddleware()` - Handle CORS

#### 5. Routes
- **File**: `backend/cmd/api/main.go`
- **Endpoints**:
  ```
  POST /api/auth/login           - Login
  POST /api/auth/register        - Register akun baru
  POST /api/auth/forgot-password - Reset password
  POST /api/auth/logout          - Logout
  ```

### Frontend (Next.js)

#### 1. Login Page
- **File**: `frontend/src/app/login/page.tsx`
- **Route**: `/login`
- **Features**:
  - Form username & password
  - Error handling & validation
  - Link ke forgot password
  - Link ke register
  - Auto redirect ke dashboard setelah login

#### 2. Forgot Password Page
- **File**: `frontend/src/app/forgot-password/page.tsx`
- **Route**: `/forgot-password`
- **Features**:
  - Form username, password baru, konfirmasi password
  - Validasi password match
  - Success message
  - Auto redirect ke login setelah berhasil

#### 3. Register Page
- **File**: `frontend/src/app/register/page.tsx`
- **Route**: `/register`
- **Features**:
  - Form username, password, konfirmasi password
  - Optional: full name & email
  - Validasi input (min length, password match)
  - Success message
  - Auto redirect ke login setelah berhasil

---

## 🚀 Cara Setup

### 1. Update Dependencies

```powershell
# Backend - install bcrypt untuk password hashing
cd backend
go get golang.org/x/crypto/bcrypt
go mod tidy
```

### 2. Run Database Migration

```powershell
# Gunakan psql untuk run migration
cd backend
$env:PGPASSWORD="postgres"
psql -U postgres -d actlog -f migrations/005_create_users_table.up.sql
```

Atau pakai script manual:
```sql
-- Connect to actlog database
\c actlog

-- Run migration file
\i C:/Kuliah/Project/Dashboard-BPK/backend/migrations/005_create_users_table.up.sql
```

### 3. Start Backend

```powershell
cd backend
go run cmd/api/main.go
```

Server akan berjalan di `http://localhost:8080`

### 4. Start Frontend

```powershell
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

---

## 🧪 Testing

### Test Endpoints dengan PowerShell

#### 1. Register (Create Account)
```powershell
$body = @{
    username = "testuser"
    password = "test123"
    confirm_password = "test123"
    full_name = "Test User"
    email = "test@bpk.go.id"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

#### 2. Login
```powershell
$body = @{
    username = "testuser"
    password = "test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

#### 3. Forgot Password
```powershell
$body = @{
    username = "testuser"
    new_password = "newpass123"
    confirm_password = "newpass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/forgot-password" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Test di Browser

1. Buka `http://localhost:3000/login`
2. Buka `http://localhost:3000/register`
3. Buka `http://localhost:3000/forgot-password`

---

## 📋 Default Accounts

Setelah migration, ada 1 default admin account:

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

---

## 🔒 Security Features

1. **Password Hashing**: Menggunakan bcrypt dengan cost 10
2. **Input Validation**: 
   - Username min 3 karakter
   - Password min 6 karakter
   - Email format validation
3. **Role-based Access**: User & Admin
4. **Active Status**: Bisa disable user dengan `is_active = false`
5. **Last Login Tracking**: Mencatat kapan terakhir login

---

## 🎨 Design System

Semua halaman auth mengikuti design yang sama:

- **Warna Utama**: Orange (#F97316, #FB923C)
- **Background**: Gradient orange-white dengan pattern
- **Card**: White dengan backdrop blur & shadow
- **Button**: Gradient orange dengan hover effect
- **Input**: Rounded dengan icon & focus ring orange

---

## 📝 Next Steps (Opsional)

1. **JWT Implementation**: Ganti session token dengan JWT
2. **Email Verification**: Kirim email untuk verifikasi akun
3. **Password Reset via Email**: Kirim link reset via email
4. **Remember Me**: Fitur remember login
5. **2FA**: Two-factor authentication
6. **Password Strength Meter**: Indicator kekuatan password
7. **Profile Page**: Halaman edit profile user
8. **Admin Panel**: Dashboard khusus admin untuk manage users

---

## 🐛 Troubleshooting

### Error: "Failed to connect to database"
- Pastikan PostgreSQL running
- Check connection string di `.env`
- Pastikan database `actlog` sudah ada

### Error: "golang.org/x/crypto not found"
```powershell
cd backend
go get golang.org/x/crypto/bcrypt
go mod tidy
```

### Error: "CORS policy"
- Pastikan backend sudah running di port 8080
- Check CORS middleware sudah aktif

### Error: "Username sudah digunakan"
- Username harus unique
- Coba username lain atau check database

---

## 📞 Contact

Untuk pertanyaan atau issue, silakan hubungi tim development.

**BADAN PEMERIKSA KEUANGAN REPUBLIK INDONESIA**

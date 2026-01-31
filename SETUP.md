# 🚀 Setup & Installation Guide - Dashboard BPK

## ✅ Prerequisites

### Required Software:
- **Node.js** 18.17.0 atau lebih baru
- **Go** 1.21 atau lebih baru
- **PostgreSQL** 15+ (Manual setup - NO DOCKER)
- **Git** untuk version control

---

## 📦 FASE 1: Installation Complete!

### ✓ Frontend Setup (Next.js 14 + TypeScript)
```powershell
cd c:\Users\Rayhansw\KULIAH\MagangBPK\Dashboard-BPK\frontend
npm install  # ✅ DONE - 488 packages installed
```

**Dependencies Installed:**
- ✅ Next.js 14.2.18
- ✅ React 18.3.1
- ✅ TypeScript 5.3.3
- ✅ Tailwind CSS 3.4.1 (dengan BPK design tokens)
- ✅ Zustand 4.5.0 (State Management)
- ✅ Recharts 2.12.0 (Charts)
- ✅ Leaflet 1.9.4 (Maps)
- ✅ Axios 1.6.7 (API Client)
- ✅ Radix UI Components

### ✓ Backend Setup (Golang + Gin)
```powershell
cd c:\Users\Rayhansw\KULIAH\MagangBPK\Dashboard-BPK\backend
go mod download  # ✅ DONE - All modules verified
```

**Dependencies Installed:**
- ✅ Gin Web Framework v1.10.0
- ✅ GORM v1.25.7 + PostgreSQL Driver v1.5.7
- ✅ JWT v5.2.0
- ✅ Zerolog v1.32.0
- ✅ Godotenv v1.5.1
- ✅ Bcrypt (golang.org/x/crypto)

---

## 🗄️ Database Setup (PostgreSQL)

### Quick Setup (Recommended)

**Automated setup dengan 1 command:**

```powershell
cd backend\scripts
.\setup_database.ps1
```

Script akan otomatis:
- ✅ Create database `actlog`
- ✅ Run migrations (create tables)
- ✅ Seed default data
- ✅ Verify setup

📖 **Detail lengkap**: Lihat [DATABASE_SETUP.md](DATABASE_SETUP.md) atau [backend/DATABASE_README.md](backend/DATABASE_README.md)

### Manual Setup

1. **Install PostgreSQL 15+**
   Download dari: https://www.postgresql.org/download/windows/

2. **Create Database**
   ```sql
   -- Login ke PostgreSQL
   psql -U postgres
   
   -- Create database
   CREATE DATABASE actlog;
   ```

3. **Run Migration**
   ```powershell
   psql -U postgres -d actlog -f backend/migrations/001_create_tables.up.sql
   ```

**Migration Creates:**
- ✅ `activity_logs` table (main data)
- ✅ `users` table (authentication)
- ✅ `provinces` table (regional data)
- ✅ `organizational_units` table (BPK units)
- ✅ Indexes untuk performance
- ✅ Default admin user (username: `admin`, password: `admin123`)

---

## ⚙️ Configuration

### Backend Environment (.env)
```powershell
# Copy example file
cd backend
Copy-Item .env.example .env

# Edit .env dengan credentials PostgreSQL Anda:
# DB_PASSWORD=your_actual_password
# JWT_SECRET=generate_random_secret_key_here
```

**File: `backend/.env`**
```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here  # ⚠️ UBAH INI!
DB_NAME=actlog
JWT_SECRET=your_jwt_secret_key  # ⚠️ UBAH INI!
```

### Frontend Environment
**File: `frontend/.env.local`** (✅ Already created)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🚀 Running the Application

### Terminal 1: Start Backend (Port 8080)
```powershell
cd c:\Users\Rayhansw\KULIAH\MagangBPK\Dashboard-BPK\backend
go run cmd/api/main.go

# Expected output:
# 🚀 Server starting on port 8080
# [GIN-debug] Listening and serving HTTP on :8080
```

**Test Backend:**
```powershell
# Health check
curl http://localhost:8080/health

# Expected response:
# {"service":"Dashboard BPK API","status":"ok","version":"1.0.0"}
```

### Terminal 2: Start Frontend (Port 3000)
```powershell
cd c:\Users\Rayhansw\KULIAH\MagangBPK\Dashboard-BPK\frontend
npm run dev

# Expected output:
# ▲ Next.js 14.2.18
# - Local:        http://localhost:3000
# ✓ Ready in 2.3s
```

**Access Application:**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:8080
- 📊 **Dashboard**: http://localhost:3000/
- 🗺️ **Regional**: http://localhost:3000/regional

---

## 📁 Project Structure

```
Dashboard-BPK/
├── frontend/                      # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Dashboard User Monitor (/)
│   │   │   ├── regional/
│   │   │   │   └── page.tsx       # Analisis Regional (/regional)
│   │   │   ├── layout.tsx         # Root Layout
│   │   │   └── globals.css        # Tailwind + BPK Design
│   │   ├── lib/
│   │   │   └── utils.ts           # Utility functions
│   │   ├── services/
│   │   │   └── api.ts             # API Service (Axios)
│   │   └── stores/
│   │       └── appStore.ts        # Zustand State
│   ├── design-tokens.json         # Figma Design Tokens
│   ├── tailwind.config.ts         # Tailwind + BPK Colors
│   ├── package.json
│   └── .env.local
│
├── backend/                       # Golang Backend
│   ├── cmd/
│   │   └── api/
│   │       └── main.go            # Main Entry Point
│   ├── internal/
│   │   └── handler/
│   │       └── dashboard_handler.go  # API Handlers
│   ├── migrations/
│   │   ├── 001_create_tables.up.sql   # Migration UP
│   │   └── 001_create_tables.down.sql # Migration DOWN
│   ├── go.mod
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🧪 Testing Endpoints

### Dashboard Stats
```powershell
curl http://localhost:8080/api/dashboard/stats
```

### Recent Activities
```powershell
curl http://localhost:8080/api/dashboard/activities
```

### Chart Data
```powershell
# Interaction mode chart
curl http://localhost:8080/api/dashboard/charts/interaction

# Hourly distribution chart
curl http://localhost:8080/api/dashboard/charts/hourly
```

### Regional Data
```powershell
# Provinces
curl http://localhost:8080/api/regional/provinces

# Organizational units
curl http://localhost:8080/api/regional/units
```

---

## 📝 Default Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`
- ⚠️ **PENTING**: Ubah password ini di production!

---

## 🐛 Troubleshooting

### Frontend Issues

**Error: "Cannot find module..."**
```powershell
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error: "Port 3000 already in use"**
```powershell
# Change port
$env:PORT=3001; npm run dev
```

### Backend Issues

**Error: "connect: connection refused" (Database)**
1. Pastikan PostgreSQL running
2. Check credentials di `.env`
3. Test connection: `psql -U postgres -d dashboard_bpk`

**Error: "Port 8080 already in use"**
```powershell
# Change port in .env
PORT=8081
```

### Database Issues

**Migration failed**
```powershell
# Rollback
psql -U postgres -d dashboard_bpk -f backend/migrations/001_create_tables.down.sql

# Re-run migration
psql -U postgres -d dashboard_bpk -f backend/migrations/001_create_tables.up.sql
```

---

## ✅ Next Steps (FASE 2)

1. ✅ Verifikasi kedua server berjalan
2. ⏳ Import CSV data (`actLog_202601091608.csv`) ke database
3. ⏳ Implement real API handlers (replace mock data)
4. ⏳ Build Dashboard UI components (8 widgets)
5. ⏳ Implement authentication system

---

## 📚 Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Gin Framework**: https://gin-gonic.com/docs/
- **GORM**: https://gorm.io/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Figma Design**: https://www.figma.com/design/yHuEwRXxFOAhq600fRXWzp/

---

**Status**: ✅ FASE 1 COMPLETE - Project Structure & Dependencies Ready
**Date**: 27 Januari 2026

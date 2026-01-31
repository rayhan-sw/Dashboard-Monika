# Dashboard Monitoring BIDICS BPK RI

> **Fase 1**: Dashboard User Monitor & Analisis Regional

##  Deskripsi Proyek

Dashboard monitoring aktivitas pengguna BIDICS (BPK Integrated Data and Information Center System) untuk Badan Pemeriksa Keuangan Republik Indonesia. Sistem ini menyediakan visualisasi real-time aktivitas pengguna, analisis regional, dan pemantauan kesalahan sistem.

##  Design System

- **File Figma**: [BPK-DASHBOARD--Dev-Mode](https://www.figma.com/design/yHuEwRXxFOAhq600fRXWzp/BPK-DASHBOARD--Dev-Mode-?node-id=392-465)
- **Design Tokens**: Tersedia di `design-tokens.json`
- **Font**: Plus Jakarta Sans (400, 500, 600, 700, 800)
- **Primary Color**: #FEB800 (BPK Gold)
- **Secondary Color**: #E27200 (Orange)

## Tech Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: Shadcn UI + Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **Maps**: Leaflet + OpenStreetMap
- **Date Handling**: date-fns

### Backend 

- **Language**: Golang 1.23+
- **Framework**: Gin
- **Database**: PostgreSQL 15+
- **ORM**: GORM
- **Environment**: godotenv
- **UUID**: google/uuid

##  Struktur Proyek

```
Dashboard-BPK/
├── frontend/                 # Next.js 14 Application
│   ├── src/
│   │   ├── app/             # App Router Pages
│   │   │   ├── page.tsx             # Dashboard User Monitor
│   │   │   └── regional/            # Analisis Regional
│   │   ├── components/       # React Components
│   │   │   ├── layout/              # Sidebar, Header
│   │   │   ├── charts/              # Chart Components
│   │   │   ├── maps/                # Map Components
│   │   │   └── tables/              # Table Components
│   │   ├── stores/          # Zustand State Management
│   │   ├── lib/             # Utilities & Helpers
│   │   └── services/        # API Services
│   └── package.json
│
└── backend/                 # Golang API Server
    ├── cmd/
    │   └── api/             # Main Application Entry
    ├── internal/
    │   ├── domain/          # Business Logic
    │   ├── handler/         # HTTP Handlers
    │   ├── repository/      # Database Layer
    │   └── usecase/         # Use Cases
    ├── migrations/          # Database Migrations
    ├── scripts/             # Utility Scripts
    └── go.mod
```

##  Fase 1 - Fitur Utama

### Dashboard User Monitor (Route: `/`)

1. **Card Analisis Sistem** - Warning banner untuk kesalahan logout
2. **4 Stats Cards**:
   - Total Pengguna
   - Login Berhasil
   - Total Aktivitas
   - Kesalahan Logout
3. **Riwayat Aktivitas** - Log aktivitas pengguna terbaru
4. **Mode Interaksi Pengguna** - Pie chart kategorisasi aktivitas
5. **Jam Tersibuk** - Card highlight peak hours
6. **Distribusi Aktivitas** - Line chart tren per jam
7. **Analisis Tingkat Keberhasilan** - Bar chart login success rate
8. **Pemantauan Kesalahan Logout** - Tabel error flags

### Analisis Regional & Unit (Route: `/regional`)

- Peta Indonesia dengan filter provinsi
- Tabel aktivitas per regional
- Statistik per unit organisasi

##  Autentikasi & Otorisasi

- **JWT Token** dengan refresh mechanism
- **Role-Based Access Control (RBAC)**:
  - Admin BPK (Full Access)
  - Regional User (Limited Access)

##  Data Source

- **File CSV**: `actLog_202601091608.csv`
- **Delimiter**: Semicolon (`;`)
- **Encoding**: UTF-8
- **Log Fields**: Timestamp, Username, Action, IP Address, Status, etc.

##  Deployment

- **NO DOCKER** - Direct deployment
- **Frontend**: Vercel / Manual VPS
- **Backend**: VPS dengan systemd service
- **Database**: PostgreSQL 15+ (Manual setup)

##  Development Setup

### Prerequisites

- Node.js 18+ & npm
- Golang 1.23+
- PostgreSQL 15+
- DBeaver (untuk database management)

### Backend Setup

**Quick Start (Recommended):**

1. **Setup Database Otomatis**:

   ```bash
   cd backend/scripts
   .\setup_database.ps1
   ```

   Script akan otomatis:
   - ✅ Create database `actlog`
   - ✅ Run migrations (create tables)
   - ✅ Seed default data
   - ✅ Verify setup

   📖 **Untuk anggota tim baru**: Lihat [TEAM_SETUP_GUIDE.md](TEAM_SETUP_GUIDE.md)

2. **Configure Environment**:

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env dengan password PostgreSQL kamu
   ```

3. **Install Dependencies**:

   ```bash
   go mod tidy
   ```

4. **Import CSV Data** (Opsional):

   ```bash
   go run cmd/import/main.go "path/to/actLog_202601091608.csv"
   ```

5. **Run Server**:

   ```bash
   cd cmd/api
   .\run.ps1
   # Server runs on http://localhost:8080
   ```

6. **Test API**:
   ```bash
   cd ..\..
   .\test-api.ps1
   ```

**Manual Setup:**

Lihat dokumentasi lengkap di [backend/DATABASE_README.md](backend/DATABASE_README.md)

### Frontend Setup

_(Will be added in FASE 3)_

##  Environment Variables

### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=12345678
DB_NAME=dashboard_bpk
PORT=8080
```

## 🗓️ Development Timeline

- **Fase 0A**:  Extract Figma Design
- **Fase 0B**:  Create Workspace Folder
- **Fase 1**:  Setup Project Structure & Migrations
- **Fase 2**:  Implement Database & Backend API
- **Fase 3**:  Build Frontend Components
- **Fase 4**:  Integration & Testing
- **Fase 5**:  Deployment Configuration
- **Fase 6**:  Final Testing & Documentation

## 👥 Tim Development

- **Client**: Biro TI BPK RI
- **Development**: [Your Team]
- **Design System**: Figma Design Team

##  License

Internal Project - Badan Pemeriksa Keuangan RI

---

**Status Terakhir**: FASE 2 COMPLETED - Backend API Ready
**Tanggal**: 9 Januari 2025

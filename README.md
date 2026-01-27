# Dashboard Monitoring BIDICS BPK RI

> **Fase 1**: Dashboard User Monitor & Analisis Regional

## 📋 Deskripsi Proyek

Dashboard monitoring aktivitas pengguna BIDICS (BPK Integrated Data and Information Center System) untuk Badan Pemeriksa Keuangan Republik Indonesia. Sistem ini menyediakan visualisasi real-time aktivitas pengguna, analisis regional, dan pemantauan kesalahan sistem.

## 🎨 Design System

- **File Figma**: [BPK-DASHBOARD--Dev-Mode](https://www.figma.com/design/yHuEwRXxFOAhq600fRXWzp/BPK-DASHBOARD--Dev-Mode-?node-id=392-465)
- **Design Tokens**: Tersedia di `design-tokens.json`
- **Font**: Plus Jakarta Sans (400, 500, 600, 700, 800)
- **Primary Color**: #FEB800 (BPK Gold)
- **Secondary Color**: #E27200 (Orange)

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: Shadcn UI + Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **Maps**: Leaflet + OpenStreetMap
- **Date Handling**: date-fns

### Backend

- **Language**: Golang 1.21+
- **Framework**: Gin
- **Database**: PostgreSQL 15+
- **ORM**: GORM
- **Authentication**: JWT + RBAC
- **Logging**: Zerolog

## 📁 Struktur Proyek

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

## 📊 Fase 1 - Fitur Utama

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

## 🔐 Autentikasi & Otorisasi

- **JWT Token** dengan refresh mechanism
- **Role-Based Access Control (RBAC)**:
  - Admin BPK (Full Access)
  - Regional User (Limited Access)

## 📦 Data Source

- **File CSV**: `actLog_202601091608.csv`
- **Delimiter**: Semicolon (`;`)
- **Encoding**: UTF-8
- **Log Fields**: Timestamp, Username, Action, IP Address, Status, etc.

## 🎯 Deployment

- **NO DOCKER** - Direct deployment
- **Frontend**: Vercel / Manual VPS
- **Backend**: VPS dengan systemd service
- **Database**: PostgreSQL 15+ (Manual setup)

## 🛠️ Development Setup

_(Akan diisi pada fase setup)_

## 📝 Environment Variables

_(Akan diisi pada fase setup)_

## 🗓️ Development Timeline

- **Fase 0A**: ✅ Extract Figma Design
- **Fase 0B**: ✅ Create Workspace Folder
- **Fase 1**: ⏳ Setup Project Structure
- **Fase 2**: ⏳ Implement Database & Backend API
- **Fase 3**: ⏳ Build Frontend Components
- **Fase 4**: ⏳ Integration & Testing
- **Fase 5**: ⏳ Deployment Configuration
- **Fase 6**: ⏳ Final Testing & Documentation

## 👥 Tim Development

- **Client**: Biro TI BPK RI
- **Development**: [Your Team]
- **Design System**: Figma Design Team

## 📄 License

Internal Project - Badan Pemeriksa Keuangan RI

---

**Status Terakhir**: Fase 0B Completed - Workspace Initialized
**Tanggal**: 27 Januari 2026

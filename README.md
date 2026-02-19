# Dashboard Monitoring BIDICS BPK RI

Dashboard monitoring aktivitas pengguna BIDICS untuk Badan Pemeriksa Keuangan Republik Indonesia.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, Recharts, Leaflet |
| Backend | Go 1.23+, Gin, GORM, PostgreSQL 15+ |

## Quick Start

### 1. Prerequisites
- Node.js 18.17+
- Go 1.21+
- PostgreSQL 15+

### 2. Database Setup

```powershell
# Buat database
createdb -U postgres daring_bpk

# Jalankan migrasi database
cd backend
go run cmd/migrate/main.go
```

### 3. Run Development

```powershell
# Option 1: Satu script untuk semua
.\start-dev.ps1

# Option 2: Manual (buka 2 terminal)
# Terminal 1 - Backend
cd backend && go run cmd/api/main.go

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4. Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/health

## Project Structure

```
Dashboard-BPK/
├── frontend/                 # Next.js Application
│   └── src/
│       ├── app/              # Pages (dashboard, regional, search, dll)
│       ├── components/       # UI Components
│       ├── services/         # API Client
│       └── stores/           # Zustand State
│
├── backend/                  # Go API Server (lihat backend/README.md untuk struktur lengkap)
│   ├── cmd/api/              # Entry point API
│   ├── cmd/import/           # Data import tool
│   ├── cmd/migrate/          # Database migrations
│   ├── internal/             # auth, dto, entity, handler, middleware, repository, response, server
│   └── migrations/           # SQL Migrations
│
├── start-dev.ps1             # Start all servers
└── stop-dev.ps1              # Stop all servers
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/activities` | Activity logs |
| GET | `/api/dashboard/charts/:type` | Chart data (interaction/hourly) |
| GET | `/api/regional/provinces` | Province list |
| GET | `/api/regional/units` | Unit list |
| GET | `/api/search` | Global search |

## Environment Variables

Backend `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=daring_bpk
```

## Design System

- **Design File**: [Figma](https://www.figma.com/design/yHuEwRXxFOAhq600fRXWzp/BPK-DASHBOARD--Dev-Mode-)
- **Primary Color**: #FEB800 (BPK Gold)
- **Secondary Color**: #E27200 (Orange)
- **Font**: Plus Jakarta Sans

## Common Commands

```powershell
# Start servers
.\start-dev.ps1

# Stop servers
.\stop-dev.ps1

# Build frontend production
cd frontend && npm run build && npm start

# Database reset
psql -U postgres -c "DROP DATABASE daring_bpk;"
psql -U postgres -c "CREATE DATABASE daring_bpk;"
cd backend && go run cmd/migrate/main.go
```

---
**BPK RI** - Badan Pemeriksa Keuangan Republik Indonesia

# Dashboard Monitoring Monika

Dashboard monitoring aktivitas pengguna

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

# Jalankan setup script
cd backend\scripts
.\setup_database.ps1
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
├── backend/                  # Go API Server
│   ├── cmd/api/              # Entry point
│   ├── internal/
│   │   ├── handler/          # HTTP Handlers
│   │   ├── repository/       # Database Layer
│   │   └── entity/           # Data Models
│   ├── migrations/           # SQL Migrations
│   └── scripts/              # Utility Scripts
│
├── start-dev.ps1             # Start all servers
└── stop-dev.ps1              # Stop all servers
```




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
cd backend\scripts && .\setup_database.ps1
```


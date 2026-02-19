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
│       │   └── auth/
│       │       ├── _hooks/   # Controller layer (custom hooks)
│       │       └── _services/# Model layer (API calls)
│       ├── components/       # View layer (UI Components)
│       ├── services/         # API Client
│       └── stores/           # Zustand State Management
│
├── backend/                  # Go API Server
│   ├── cmd/api/              # Application entry point
│   ├── internal/
│   │   ├── entity/           # Domain models (Model)
│   │   ├── service/          # Business logic layer
│   │   ├── handler/          # HTTP handlers (Controller)
│   │   ├── repository/       # Data access layer (Model)
│   │   └── middleware/       # Cross-cutting concerns
│   ├── migrations/           # SQL Migrations
│   └── scripts/              # Utility Scripts
│
├── ARCHITECTURE.md           # Architecture documentation
├── REFACTORING_SUMMARY.md    # Recent refactoring details
├── start-dev.ps1             # Start all servers
└── stop-dev.ps1              # Stop all servers
```

## Architecture

This project follows **Clean Architecture** and **MVC (Model-View-Controller)** principles:

### Backend (Go)
- **Controllers**: `handler/` - HTTP request/response handling
- **Services**: `service/` - Business logic and orchestration
- **Models**: `entity/` + `repository/` - Data models and persistence
- **Clear separation** of concerns with dependency injection

### Frontend (Next.js/React)
- **View**: React components for presentation
- **Controller**: Custom hooks for state and logic
- **Model**: API services for data access

📖 See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.
📊 See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) for recent improvements.

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
cd backend\scripts && .\setup_database.ps1
```

---
**BPK RI** - Badan Pemeriksa Keuangan Republik Indonesia

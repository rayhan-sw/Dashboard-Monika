# Backend — Dashboard BPK

API server Go (Gin + GORM + PostgreSQL) untuk Dashboard Monitoring BIDICS BPK RI.

## Struktur Folder

```
backend/
├── cmd/                    # Entry point aplikasi
│   ├── api/                # HTTP API server
│   │   ├── main.go         # Inisialisasi env, DB, router, run server
│   │   └── run.ps1         # Script jalankan API dari sini
│   ├── import/             # CLI impor data CSV ke DB
│   │   └── main.go
│   └── migrate/            # CLI migrasi database
│       └── main.go
│
├── internal/               # Kode privat (hanya dipakai oleh proyek ini)
│   ├── auth/               # Autentikasi & JWT
│   │   └── jwt.go          # GenerateToken, ValidateToken (JWT_SECRET, JWT_EXPIRY)
│   ├── dto/                # Data Transfer Object (response shape untuk API)
│   │   └── dto.go          # ActivityLogDTO, ToDTO
│   ├── entity/             # Model domain (entity DB & request DTO)
│   │   ├── activity_log.go # ActivityLog, ref (Cluster, SatkerUnit, dll.)
│   │   ├── user.go         # User, LoginRequest, RegisterRequest, dll.
│   │   └── report_access.go# ReportAccessRequest, Notification
│   ├── handler/            # HTTP handler (hanya *_handler.go + repo helper)
│   │   ├── auth_handler.go
│   │   ├── dashboard_handler.go
│   │   ├── search_handler.go
│   │   ├── content_handler.go
│   │   ├── report_handler.go
│   │   ├── notification_handler.go
│   │   ├── org_tree_handler.go
│   │   ├── metadata_handler.go
│   │   └── repo.go         # getActivityLogRepo(), getSearchRepo()
│   ├── response/           # Helper response HTTP (error, 500)
│   │   └── response.go    # Internal(c, err), Error(c, code, msg)
│   ├── middleware/        # Middleware HTTP
│   │   └── auth.go         # AuthMiddleware (JWT), AdminMiddleware
│   ├── repository/        # Akses data (satu repo per aggregate/domain)
│   │   ├── activity_log_repository.go
│   │   ├── search_repository.go
│   │   ├── content_repository.go
│   │   └── report_repository.go
│   └── server/            # Konfigurasi router & route registration
│       └── router.go      # SetupRouter() — CORS, health, semua route /api/*
│
├── pkg/                    # Paket yang bisa dipakai ulang (reusable)
│   └── database/          # Koneksi PostgreSQL
│       └── postgres.go    # InitDB, GetDB, CloseDB, BuildDSN
│
├── migrations/             # SQL migrations (urutan: 001, 002, …)
│   └── *_*.up.sql / *_*.down.sql
│
├── .env.example            # Contoh env (PORT, DB_*, JWT_*, CORS)
├── go.mod / go.sum
└── README.md               # Dokumen ini
```

## Alur Ringkas

- **cmd/api/main.go**: Load `.env` → `database.InitDB()` → `server.SetupRouter()` → `r.Run(port)`.
- **internal/server/router.go**: Mendefinisikan semua route dan middleware (CORS, health, `/api/auth`, `/api/dashboard`, dll.).
- **internal/handler**: Hanya berisi handler HTTP dan `repo.go`. Handler memanggil repository, mengembalikan JSON; error 500 lewat `response.Internal(c, err)`. DTO dari `dto` package (`dto.ActivityLogDTO`, `dto.ToDTO`).
- **internal/auth**: Login memakai `auth.GenerateToken()`; route yang dilindungi memakai `AuthMiddleware()` yang memvalidasi JWT dan meng-set `user_id` / `user_role` di context.

## Menjalankan

```powershell
# Dari root repo
.\start-dev.ps1

# Atau manual
cd backend
go run cmd/api/main.go          # API
go run cmd/migrate/main.go      # Migrasi
go run cmd/import/main.go file.csv  # Impor CSV
```

## Env

Lihat `.env.example`. Wajib: `DB_*`, `JWT_SECRET`. Opsional: `PORT`, `JWT_EXPIRY`, `DB_SSLMODE`.

# Backend — Dashboard Monitoring BIDICS BPK RI

API server berbasis **Go** (Gin + GORM + PostgreSQL) untuk aplikasi Dashboard Monitoring BIDICS BPK RI. Menyediakan autentikasi JWT, data aktivitas, statistik dashboard, laporan (CSV/Excel/PDF), pencarian, notifikasi, dan manajemen akses laporan.

---

## Daftar Isi

1. [Ringkasan & Tech Stack](#ringkasan--tech-stack)
2. [Struktur Folder & File](#struktur-folder--file)
3. [Alur Aplikasi](#alur-aplikasi)
4. [Dokumentasi API](#dokumentasi-api)
5. [Format Response & Error](#format-response--error)
6. [Cara Menjalankan](#cara-menjalankan)
7. [Environment Variables](#environment-variables)
8. [Migrasi & Impor Data](#migrasi--impor-data)
9. [Keamanan (Penting untuk Production & GitHub)](#keamanan-penting-untuk-production--github)

---

## Ringkasan & Tech Stack

| Aspek | Keterangan |
|-------|------------|
| **Bahasa** | Go 1.24+ |
| **Framework HTTP** | Gin |
| **ORM / DB** | GORM + PostgreSQL |
| **Autentikasi** | JWT (header `Authorization: Bearer <token>`) |
| **Konfigurasi** | File `.env` (godotenv); **jangan commit `.env` ke Git** |

**Fitur utama:**

- **Autentikasi:** Login/Register (email domain @bpk.go.id), ganti password, lupa password
- **Dashboard:** Statistik, aktivitas paginated, chart (per jam/cluster/provinsi), tingkat sukses akses, cluster, error logout
- **Regional:** Provinsi, lokasi, unit/satker, jam per satker, top kontributor
- **Konten/Analitik:** Peringkat dashboard, modul pencarian, ekspor, intensi operasional, chart global economics
- **Laporan:** Template, generate CSV/Excel/PDF, download, riwayat unduhan, permintaan akses
- **Notifikasi, profil user, pencarian global/saran/user/satker**
- **Metadata:** Daftar satker, root Eselon I, anak root
- **Pohon organisasi:** Tree, level eselon, pencarian unit

---

## Struktur Folder & File

Setiap folder dan file di bawah dijelaskan **fungsinya** dan **digunakan untuk apa**.

```
backend/
├── cmd/                                    # Entry point aplikasi (bukan library)
│   ├── api/
│   │   └── main.go                         # Menjalankan API server: load .env, InitDB, SetupRouter, Run(port)
│   ├── import/
│   │   └── main.go                         # CLI impor CSV ke DB: baca CSV, resolve referensi (cluster, satker, user), insert ActivityLog (ON CONFLICT DO NOTHING)
│   └── migrate/
│       └── main.go                         # CLI migrasi schema: jalankan *.up.sql di migrations/ berurutan, catat di schema_migrations
│
├── internal/                               # Kode privat (hanya untuk proyek ini)
│   ├── auth/
│   │   └── jwt.go                          # GenerateToken, ValidateToken; Claims (user_id, role); pakai JWT_SECRET & JWT_EXPIRY dari env
│   ├── config/
│   │   └── config.go                       # Konstanta paginasi/limit, GetJWTExpiry, AllowedOrigins/CORSOrigin, IntEnv
│   ├── dto/
│   │   └── dto.go                          # ActivityLogDTO (bentuk datar), ToDTO(entity → DTO) untuk response API
│   ├── entity/
│   │   ├── activity_log.go                 # ActivityLog + relasi (User, Satker, ActivityType, Cluster, Location); tabel referensi
│   │   ├── user.go                         # User, LoginRequest, RegisterRequest, ForgotPasswordRequest, ChangePasswordRequest, LoginResponse
│   │   └── report_access.go                # ReportAccessRequest, Notification, struktur report_access_requests
│   ├── handler/                            # HTTP handler per domain (bind request, panggil repo/service, return JSON)
│   │   ├── auth_handler.go                # Login, Register, ForgotPassword, Logout, ChangePassword
│   │   ├── dashboard_handler.go           # Stats, Activities, ChartData, AccessSuccessRate, DateRange, Clusters, LogoutErrors, dll.
│   │   ├── content_handler.go             # DashboardRankings, SearchModuleUsage, ExportStats, OperationalIntents, GlobalEconomicsChart
│   │   ├── report_handler.go              # Templates, GenerateReport, DownloadFile, RecentDownloads, AccessRequests, RequestAccess, UpdateAccessRequest
│   │   ├── notification_handler.go        # GetNotifications, MarkRead, MarkAllRead
│   │   ├── org_tree_handler.go            # OrganizationalTree, EselonLevels, SearchOrganizationalUnits
│   │   ├── metadata_handler.go            # SatkerList, SatkerRoots, SatkerRootChildren
│   │   ├── profile_handler.go             # GetProfile, UpdateProfilePhoto, RequestReportAccess
│   │   ├── search_handler.go              # GlobalSearch, GetSearchSuggestions, SearchUsers, SearchSatker
│   │   └── repo.go                        # getActivityLogRepo(), getSearchRepo(), getReportRepo() — helper injeksi repo ke handler
│   ├── response/
│   │   └── response.go                     # Internal(c, err) → 500; Error(c, code, msg) → JSON error
│   ├── middleware/
│   │   └── auth.go                        # AuthMiddleware (validasi JWT, set user_id/user_role di context), AdminMiddleware
│   ├── repository/                         # Akses database (query, preload, aggregate)
│   │   ├── activity_log_repository.go    # Aktivitas: GetRecentActivities, GetTotalCount, GetCountByStatus, GetBusiestHour, GetSatkerIdsUnderRoot, chart/regional/top/errors
│   │   ├── search_repository.go           # Pencarian global, saran, search users/satker
│   │   ├── content_repository.go          # DashboardRankings, SearchModuleUsage, ExportStats, OperationalIntents, GlobalEconomicsChart
│   │   └── report_repository.go           # GenerateReportData, report_downloads, access_requests
│   ├── service/                            # Logika bisnis (bukan sekadar CRUD)
│   │   ├── auth_service.go                # Login, Register, ResetPassword (validasi, bcrypt, duplikat); generateSessionToken
│   │   ├── report_generator.go            # GenerateCSV, GenerateExcel, GeneratePDF per template (org-performance, user-activity, feature-usage)
│   │   └── cleanup_service.go             # Pembersihan file laporan lama di background (interval, MaxAge)
│   └── server/
│       └── router.go                       # SetupRouter: CORS, GET /health, grup /api (auth, account, dashboard, regional, content, reports, notifications, users, profile, search, metadata, org-tree)
│
├── pkg/                                    # Paket reusable (bisa dipakai oleh cmd atau modul lain)
│   └── database/
│       └── postgres.go                     # BuildDSN (dari env), InitDB, GetDB, CloseDB; connection pool
│
├── migrations/                             # SQL migrations (urutan 001, 002, …)
│   └── *_*.up.sql / *_*.down.sql          # Schema: ref tables, user_profiles, activity_logs, users, notifications, report_downloads, dll.
│
├── seeds/                                  # Folder untuk file dump/seed (mis. daring_bpk_data.dump); isi via script export/import; file dump tidak di-commit
├── .env.example                            # Contoh variabel lingkungan — salin ke .env dan isi nilai (jangan commit .env)
├── go.mod / go.sum
└── README.md                               # Dokumen ini
```

---

## Alur Aplikasi

1. **Startup**  
   `cmd/api/main.go` → load `.env` → `database.InitDB()` → `server.SetupRouter()` → `r.Run(":PORT")`.

2. **Request masuk**  
   CORS middleware → (untuk route tertentu) AuthMiddleware memvalidasi JWT dan meng-set `user_id`, `user_role` di context → handler.

3. **Handler**  
   Bind body/query → panggil repository atau service → format response (sering pakai DTO) → `c.JSON(...)`. Error 500 lewat `response.Internal(c, err)`.

4. **Autentikasi**  
   Login: cari user (username/email), bandingkan password (bcrypt), update last_login, generate JWT. Route yang dilindungi memakai `AuthMiddleware()`; handler baca `c.Get("user_id")` / `c.Get("user_role")`.

---

## Dokumentasi API

**Base URL:** `http://localhost:8080` (atau sesuai `PORT` di env).  
**Endpoint yang memerlukan JWT:** kirim header `Authorization: Bearer <token>`.

---

### Health

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/health` | Tidak | Health check; response: status, service, version |

---

### Autentikasi (`/api/auth`) — Publik

| Method | Path | Keterangan |
|--------|------|------------|
| POST | `/api/auth/login` | Body: `username` (atau email), `password`. Response: token, user, message. |
| POST | `/api/auth/register` | Body: username, password, confirm_password, full_name, email (harus @bpk.go.id). Response: message, user. |
| POST | `/api/auth/forgot-password` | Body: username, new_password, confirm_password. Reset password by username. |
| POST | `/api/auth/logout` | Body opsional. Response: message sukses; client hapus token sendiri. |

---

### Akun (`/api/account`) — Butuh JWT

| Method | Path | Keterangan |
|--------|------|------------|
| POST | `/api/account/change-password` | Body: old_password, new_password, confirm_password. Ganti password user yang login. |

---

### Dashboard (`/api/dashboard`)

Query params umum: `start_date`, `end_date`, `cluster`, `eselon`, `root_satker_id` (filter pohon satker).

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/dashboard/stats` | Statistik ringkas: total_users, success_logins, total_activities, logout_errors, busiest_hour. |
| GET | `/api/dashboard/activities` | Daftar aktivitas paginated; query: page, page_size. Response: data (DTO), page, page_size, total, total_pages. |
| GET | `/api/dashboard/charts/:type` | type = `hourly` \| `cluster` \| `province`. Data chart sesuai filter. |
| GET | `/api/dashboard/access-success` | Tingkat sukses akses per tanggal (success vs failed per hari). |
| GET | `/api/dashboard/date-range` | Rentang tanggal min/max aktivitas (untuk date picker). |
| GET | `/api/dashboard/clusters` | Daftar cluster unik (untuk dropdown/filter). |
| GET | `/api/dashboard/logout-errors` | User dengan error logout terbanyak; query: limit. |

---

### Regional (`/api/regional`)

Query params: `start_date`, `end_date`, `cluster`, `eselon`, `root_satker_id`.

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/regional/provinces` | Statistik aktivitas per provinsi. |
| GET | `/api/regional/locations` | Statistik lokasi (satker + provinsi) untuk peta. |
| GET | `/api/regional/units` | Statistik per unit/satker; query: page, page_size. |
| GET | `/api/regional/units/hourly` | Distribusi aktivitas per jam untuk satu satker; query: satker (wajib). |
| GET | `/api/regional/top-contributors` | Top N kontributor (aktivitas terbanyak); query: limit. |

---

### Konten / Analitik (`/api/content`)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/content/dashboard-rankings` | Peringkat penggunaan dashboard (per kluster); query: start_date, end_date. |
| GET | `/api/content/search-modules` | Statistik penggunaan modul pencarian; query: start_date, end_date, cluster. |
| GET | `/api/content/export-stats` | Statistik ekspor/unduhan; query: start_date, end_date, cluster. |
| GET | `/api/content/operational-intents` | Top N intensi operasional; query: start_date, end_date, cluster, limit. |
| GET | `/api/content/global-economics` | Data chart Global Economics; query: start_date, end_date. |

---

### Laporan (`/api/reports`)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/reports/templates` | Daftar template laporan (id, title, description, formats). |
| POST | `/api/reports/generate` | Generate laporan; body: template_id, format (CSV/Excel/PDF), start_date, end_date. Response: download_url, filename. |
| GET | `/api/reports/download/:filename` | Download file laporan (filename dari generate). |
| GET | `/api/reports/downloads` | Riwayat unduhan terbaru. |
| GET | `/api/reports/access-requests` | Daftar permintaan akses (untuk admin). |
| POST | `/api/reports/request-access` | Ajukan permintaan akses; body sesuai ReportAccessRequest. |
| PUT | `/api/reports/access-requests/:id` | Update status permintaan akses (approve/reject); body: status. |

---

### Notifikasi (`/api/notifications`) — Butuh JWT

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/notifications` | Daftar notifikasi user login. |
| PUT | `/api/notifications/:id/read` | Tandai satu notifikasi sudah dibaca. |
| POST | `/api/notifications/read-all` | Tandai semua notifikasi dibaca. |

---

### Users (`/api/users`)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/users/profile` | Profil user; query: user_id. |

---

### Profil (`/api/profile`) — Butuh JWT

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/profile` | Profil user yang login. |
| PUT | `/api/profile/photo` | Update foto profil; body/form sesuai implementasi. |
| POST | `/api/profile/request-access` | Ajukan akses laporan dari profil. |

---

### Pencarian (`/api/search`)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/search` | Pencarian global; query: q, start_date, end_date, cluster, dll. |
| GET | `/api/search/suggestions` | Saran autocomplete; query: q, type. |
| GET | `/api/search/users` | Cari user; query: q. |
| GET | `/api/search/satker` | Cari satker; query: q. |

---

### Metadata (`/api/metadata`)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/metadata/satker` | Daftar satker (untuk dropdown/filter). |
| GET | `/api/metadata/satker/roots` | Daftar root Eselon I. |
| GET | `/api/metadata/satker/roots/:id/children` | Anak dari satu root (pohon satker). |

---

### Pohon Organisasi (`/api/org-tree`)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/org-tree` | Pohon organisasi; query: root_satker_id, level, dll. |
| GET | `/api/org-tree/levels` | Daftar level eselon. |
| GET | `/api/org-tree/search` | Pencarian unit organisasi; query: q. |

---

## Format Response & Error

- **Sukses:** Umumnya `200` atau `201` dengan body JSON (mis. `{"data": ...}` atau `{"message": "...", "user": ...}`).
- **Error validasi / client:** `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict dengan body `{"error": "pesan"}`.
- **Error server:** `500` Internal Server Error (detail tidak diekspos ke client untuk keamanan); log di server.
- **Misconfiguration:** Misalnya `503` jika JWT_SECRET tidak diset.

Jangan menampilkan stack trace atau detail DB ke client di production.

---

## Cara Menjalankan

**Prasyarat:** Go 1.24+, PostgreSQL, file `.env` (salin dari `.env.example` dan isi nilai; **jangan commit `.env`**).

```powershell
# Dari root repo (menjalankan backend + frontend)
.\start-dev.ps1

# Hanya backend (dari folder backend)
cd backend
go run cmd/api/main.go
```

- **Port default:** 8080 (ubah lewat env `PORT`).
- **Migrasi schema** (sekali atau setelah tambah migration):
  ```powershell
  cd backend
  go run cmd/migrate/main.go
  ```
- **Impor data dari CSV:**
  ```powershell
  cd backend
  go run cmd/import/main.go <path-file-csv>
  # Contoh: go run cmd/import/main.go data/aktivitas.csv
  ```

---

## Environment Variables

| Variabel | Wajib | Keterangan |
|----------|--------|------------|
| `PORT` | Tidak | Port HTTP server (default: 8080). |
| `GIN_MODE` | Tidak | `debug` / `release`. Gunakan `release` di production. |
| `DB_HOST` | Ya | Host PostgreSQL. |
| `DB_PORT` | Ya | Port PostgreSQL (biasanya 5432). |
| `DB_USER` | Ya | User database. |
| `DB_PASSWORD` | Ya | Password database. **Jangan commit ke Git.** |
| `DB_NAME` | Ya | Nama database (mis. daring_bpk). |
| `DB_SSLMODE` | Tidak | `disable` / `require`; default `disable`. |
| `JWT_SECRET` | Ya | Rahasia untuk tanda-tangan JWT. **Gunakan nilai kuat dan unik di production; jangan commit.** |
| `JWT_EXPIRY` | Tidak | Lama berlaku token (mis. 24h, 30m). |
| `ALLOWED_ORIGINS` | Tidak | Daftar origin CORS (dipisah koma); kosong = `*`. Di production sebaiknya daftar eksplisit. |

**Contoh:** Salin `.env.example` ke `.env` lalu isi dengan nilai lingkungan Anda. Jangan pernah commit file `.env` ke repository.

---

## Migrasi & Impor Data

- **Migrasi:** Menjalankan `cmd/migrate/main.go` akan membaca semua file `*.up.sql` di folder `migrations/` (urutan nama file) dan menerapkannya ke database. Tabel `schema_migrations` mencatat versi yang sudah dijalankan.
- **Impor CSV:** Format CSV dengan delimiter `;`, baris pertama header. Kolom yang dipakai: id_trans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token, status. Program akan membuat atau menggunakan entitas referensi (cluster, activity_type, location, satker, user_profile) lalu menyisipkan activity_log (ON CONFLICT id_trans DO NOTHING).
- **Seed/dump:** Untuk mengisi data dari dump PostgreSQL (mis. `backend/seeds/daring_bpk_data.dump`), gunakan script di folder `scripts/` (export-db / import-db); lihat `SETUP_DATA.md` di root repo jika ada. File dump tidak di-commit (lihat `.gitignore`).

---

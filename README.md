# Dashboard Monika

Dashboard internal untuk memantau aktivitas pengguna, metrik operasional, dan pengaturan akses laporan.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue) ![Go](https://img.shields.io/badge/Go-1.21-lightblue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## Fitur Utama

- Otentikasi JWT dan manajemen peran untuk pembatasan akses.
- Halaman dashboard dan regional yang menampilkan peta, grafik, dan peringkat unit kerja.
- Pencarian aktivitas dengan saran otomatis dan normalisasi input.
- Generator laporan terintegrasi yang mengekspor data ke CSV/Excel/PDF.
- Notifikasi dan alur permintaan akses laporan.

## Tech Stack

| Layer     | Teknologi                            |
| --------- | ------------------------------------ |
| Frontend  | Next.js, TypeScript, Tailwind CSS    |
| Backend   | Go (Gin), GORM                       |
| Database  | PostgreSQL                           |
| Utilities | Zustand, date-fns, Recharts, Leaflet |

## Prasyarat

- Node.js 18+
- Go 1.21+
- PostgreSQL 15+

## Cara Menjalankan

1. Clone repositori.
2. Siapkan variabel lingkungan (lihat bagian "Environment variables").
3. Pasang dependensi frontend:

```bash
cd frontend
npm install
```

4. Jalankan migrasi skema dari folder `backend`:

```bash
cd backend
go run cmd/migrate/main.go
```

5. Jalankan backend:

```bash
go run cmd/api/main.go
```

6. Jalankan frontend:

```bash
cd frontend
npm run dev
```

7. Di Windows tersedia `start-dev.ps1` untuk menjalankan layanan bersama.

## Environment variables (nama saja)

- PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- DB_SSLMODE
- JWT_SECRET
- JWT_EXPIRY
- ALLOWED_ORIGINS
- NEXT_PUBLIC_API_URL

## Struktur Folder

- `frontend` — aplikasi Next.js dan komponen antarmuka.
- `backend` — server API, handler, dan logika domain.
- `migrations` — skrip SQL untuk perubahan skema.
- `scripts` — utilitas untuk migrasi dan import/export data.
- `pkg` / `internal` — pustaka internal backend.


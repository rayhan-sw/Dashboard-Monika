# Database Setup Guide - Dashboard BPK

Panduan lengkap untuk setup database PostgreSQL untuk project Dashboard BPK.

## 📋 Daftar Isi

- [Prerequisites](#prerequisites)
- [Quick Setup (Untuk Tim)](#quick-setup-untuk-tim)
- [Manual Setup](#manual-setup)
- [Export Data (Untuk Owner)](#export-data-untuk-owner)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Sebelum memulai, pastikan sudah terinstall:

1. **PostgreSQL** (versi 12 atau lebih baru)
   - Download: https://www.postgresql.org/download/
   - Atau via Chocolatey: `choco install postgresql`
   
2. **Git** (untuk clone repository)

3. **PostgreSQL bin di PATH**
   - Tambahkan ke PATH: `C:\Program Files\PostgreSQL\16\bin`
   - Cara cek: buka PowerShell dan ketik `psql --version`

---

## Quick Setup (Untuk Tim)

**Langkah untuk anggota tim yang baru join project:**

### Step 1: Clone Repository

```powershell
git clone https://github.com/rayhan-sw/Dashboard-BPK.git
cd Dashboard-BPK
```

### Step 2: Jalankan Setup Script

```powershell
cd backend\scripts
.\setup_database.ps1
```

Script akan otomatis:
- ✅ Membuat database `actlog`
- ✅ Membuat semua tabel (users, provinces, organizational_units, activity_logs)
- ✅ Insert data default (admin user, provinces, units)
- ✅ Verifikasi setup

### Step 3: Import Data act_log (Opsional)

Jika ada file `actlog_data.sql` di `backend/seeds/`:

```powershell
.\import_actlog.ps1
```

### Step 4: Update Environment Variables

Buat file `.env` di folder `backend/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=actlog

# API Configuration
API_PORT=8080
```

### Step 5: Test Koneksi

```powershell
cd ..\cmd\api
.\run.ps1
```

Jika berhasil, kamu akan lihat:
```
✓ Connected to database
Server starting on :8080
```

---

## Manual Setup

Jika ingin setup manual tanpa script otomatis:

### 1. Create Database

```powershell
psql -U postgres -c "CREATE DATABASE actlog;"
```

### 2. Run Migrations (Create Tables)

```powershell
cd backend
psql -U postgres -d actlog -f migrations/001_create_tables.up.sql
```

### 3. Import Data (Opsional)

```powershell
psql -U postgres -d actlog -f seeds/actlog_data.sql
```

### 4. Verify

```powershell
psql -U postgres -d actlog -c "\dt"
```

---

## Export Data (Untuk Owner)

**Khusus untuk pemilik database yang ingin share data ke tim:**

### Export Schema (Struktur Tabel)

```powershell
cd backend\scripts
.\export_schema.ps1
```

Atau manual:
```powershell
pg_dump -U postgres -d actlog -s -f migrations/001_create_tables.up.sql
```

### Export Data act_log

```powershell
.\export_actlog_data.ps1
```

Atau manual:
```powershell
pg_dump -U postgres -d actlog -t act_log -a --column-inserts -f seeds/actlog_data.sql
```

### Commit ke Git

```bash
git add backend/migrations/
git add backend/seeds/
git commit -m "Update database schema and seed data"
git push
```

---

## Database Schema

### Tables

#### 1. **activity_logs**
Menyimpan log aktivitas user dari sistem BIDICS.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| username | VARCHAR(255) | Username pengguna |
| action | VARCHAR(100) | Jenis aksi (LOGIN, LOGOUT, VIEW, dll) |
| target | VARCHAR(500) | Target dari aksi |
| ip_address | VARCHAR(45) | IP address pengguna |
| user_agent | TEXT | Browser/device info |
| status | VARCHAR(50) | Status aksi (success, error) |
| province_id | VARCHAR(10) | ID provinsi |
| unit_id | VARCHAR(50) | ID unit organisasi |
| session_id | VARCHAR(255) | Session ID |
| timestamp | TIMESTAMP | Waktu aktivitas |

**Indexes:**
- `idx_activity_logs_username`
- `idx_activity_logs_timestamp`
- `idx_activity_logs_province_id`
- `idx_activity_logs_unit_id`
- `idx_activity_logs_action`
- `idx_activity_logs_status`

#### 2. **users**
Data user untuk authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| username | VARCHAR(255) | Username (unique) |
| password_hash | VARCHAR(255) | Hashed password |
| email | VARCHAR(255) | Email address |
| full_name | VARCHAR(255) | Nama lengkap |
| role | VARCHAR(50) | Role (admin, user) |
| is_active | BOOLEAN | Status aktif |
| last_login | TIMESTAMP | Last login time |

**Default User:**
- Username: `admin`
- Password: `admin123` (HARUS DIGANTI!)

#### 3. **provinces**
Referensi provinsi di Indonesia.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(10) | Kode provinsi |
| name | VARCHAR(255) | Nama provinsi |
| region | VARCHAR(50) | Region (Sumatera, Jawa, dll) |

#### 4. **organizational_units**
Struktur organisasi BPK.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | ID unit |
| name | VARCHAR(255) | Nama unit |
| parent_id | VARCHAR(50) | Parent unit (nullable) |
| type | VARCHAR(50) | Jenis unit |

#### 5. **act_log** (Imported Data)
Tabel untuk data import dari CSV/Excel logging sistem.

*Schema tergantung dari data yang di-import*

---

## Scripts Available

| Script | Purpose |
|--------|---------|
| `setup_database.ps1` | Setup lengkap database dari 0 |
| `export_actlog_data.ps1` | Export data act_log ke SQL file |
| `import_actlog.ps1` | Import data act_log dari SQL file |

---

## Troubleshooting

### ❌ "psql is not recognized"

**Problem:** PostgreSQL tidak ada di PATH.

**Solution:**
1. Cari folder PostgreSQL bin: `C:\Program Files\PostgreSQL\16\bin`
2. Tambahkan ke System PATH
3. Restart PowerShell

### ❌ "database already exists"

**Problem:** Database sudah dibuat sebelumnya.

**Solution:**
```powershell
# Drop database lama
psql -U postgres -c "DROP DATABASE actlog;"

# Jalankan setup lagi
.\setup_database.ps1
```

### ❌ "connection refused"

**Problem:** PostgreSQL service tidak running.

**Solution:**
1. Buka Services (Windows + R → `services.msc`)
2. Cari "postgresql-x64-XX"
3. Start service

### ❌ "password authentication failed"

**Problem:** Password PostgreSQL salah.

**Solution:**
- Setup password untuk user postgres
- Atau edit pg_hba.conf untuk trust local connections

### ❌ "Migration file not found"

**Problem:** File migration tidak ada di lokasi yang benar.

**Solution:**
```powershell
# Pastikan struktur folder benar:
Dashboard-BPK/
├── backend/
│   ├── migrations/
│   │   └── 001_create_tables.up.sql
│   └── scripts/
│       └── setup_database.ps1
```

### ❌ "Table 'act_log' not found"

**Problem:** Data act_log belum di-import.

**Solution:**
- Jalankan `import_actlog.ps1` jika file seed ada
- Atau import manual dari DBeaver/pgAdmin

---

## Advanced Usage

### Rollback Database

Untuk menghapus semua tabel:

```powershell
psql -U postgres -d actlog -f migrations/001_create_tables.down.sql
```

### Backup Database

Full backup:
```powershell
pg_dump -U postgres -d actlog -F c -f backup_actlog.dump
```

Restore backup:
```powershell
pg_restore -U postgres -d actlog backup_actlog.dump
```

### Connect dari Go Backend

Contoh connection string di Go:

```go
connStr := fmt.Sprintf(
    "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
    os.Getenv("DB_HOST"),
    os.Getenv("DB_PORT"),
    os.Getenv("DB_USER"),
    os.Getenv("DB_PASSWORD"),
    os.Getenv("DB_NAME"),
)
```

---

## Support

Jika ada masalah:

1. Cek [Troubleshooting](#troubleshooting) section
2. Lihat logs di terminal
3. Contact team lead
4. Buka issue di GitHub repository

---

**Last Updated:** 2026-01-31  
**Maintained by:** Rayhan SW

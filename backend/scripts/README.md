# Database Scripts

Kumpulan scripts untuk mengelola database PostgreSQL project Dashboard BPK.

## 📜 Available Scripts

### 1. `setup_database.ps1`

**Purpose:** Setup database lengkap dari awal (untuk anggota tim baru)

**Usage:**
```powershell
.\setup_database.ps1
```

**With custom parameters:**
```powershell
.\setup_database.ps1 -DBName "actlog" -DBUser "postgres" -DBHost "localhost" -DBPort 5432
```

**What it does:**
- ✅ Creates database
- ✅ Runs migrations (create tables)
- ✅ Seeds initial data
- ✅ Verifies setup

---

### 2. `export_actlog_data.ps1`

**Purpose:** Export data dari tabel `act_log` untuk sharing ke tim

**Usage:**
```powershell
.\export_actlog_data.ps1
```

**Output:** `backend/seeds/actlog_data.sql`

**Use case:** Ketika owner database ingin share data terbaru ke tim

---

### 3. `import_actlog.ps1`

**Purpose:** Import data act_log dari file seed

**Usage:**
```powershell
.\import_actlog.ps1
```

**Input:** `backend/seeds/actlog_data.sql`

**Use case:** Ketika anggota tim ingin import data act_log

---

## 🚀 Quick Start untuk Tim Baru

```powershell
# 1. Clone repository
git clone https://github.com/rayhan-sw/Dashboard-BPK.git
cd Dashboard-BPK

# 2. Setup database
cd backend\scripts
.\setup_database.ps1

# 3. Import data (jika ada)
.\import_actlog.ps1

# 4. Done! Database siap digunakan
```

---

## 📂 Expected Directory Structure

```
backend/
├── scripts/            ← You are here
│   ├── setup_database.ps1
│   ├── export_actlog_data.ps1
│   ├── import_actlog.ps1
│   └── README.md
├── migrations/
│   ├── 001_create_tables.up.sql
│   └── 001_create_tables.down.sql
└── seeds/
    ├── initial_data.sql      (optional)
    └── actlog_data.sql       (optional, for act_log import)
```

---

## 🛠️ Requirements

- PostgreSQL 12+ installed
- `psql` and `pg_dump` in PATH
- PowerShell 5.1+

---

## ⚠️ Common Issues

### Script can't find psql

**Error:**
```
ERROR: PostgreSQL 'psql' command not found!
```

**Fix:**
Add PostgreSQL bin to PATH:
```
C:\Program Files\PostgreSQL\16\bin
```

### Database already exists

**Error:**
```
database "actlog" already exists
```

**Fix:**
Script will prompt to drop and recreate. Type `yes` to proceed.

---

## 📖 More Info

See full documentation: `backend/DATABASE_README.md`

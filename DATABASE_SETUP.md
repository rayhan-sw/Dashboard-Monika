# �️ Database Setup - Dashboard BPK

**Quick setup guide untuk PostgreSQL database project Dashboard BPK.**

---

## ⚡ Quick Setup (Recommended)

Untuk setup cepat, gunakan automated script:

```powershell
cd backend\scripts
.\setup_database.ps1
```

Script akan otomatis:
- ✅ Create database `actlog`
- ✅ Run migrations (create tables)
- ✅ Seed default data (users, provinces, units)
- ✅ Verify setup

📖 **Tutorial lengkap**: Lihat [TEAM_SETUP_GUIDE.md](TEAM_SETUP_GUIDE.md) atau [backend/DATABASE_README.md](backend/DATABASE_README.md)

---

## 📋 Manual Setup

Jika ingin setup manual step-by-step:

### Option 1: Using DBeaver (RECOMMENDED)

1. **Buka DBeaver**
   - Connect ke PostgreSQL server (localhost:5432)
   - User: `postgres`
   - Password: (your PostgreSQL password)

2. **Create Database**
   - Klik kanan pada "Databases" → "Create New Database"
   - Database name: `actlog`
   - Encoding: `UTF8`
   - Klik "OK"

3. **Run Migration Script**
   - Buka database `actlog`
   - Klik "SQL Editor" (atau tekan F3)
   - Copy paste isi file: `backend/migrations/001_create_tables.up.sql`
   - Execute script (Ctrl+Enter atau tombol Play ▶️)
   - Verify: Cek di message log bahwa tables berhasil dibuat

4. **Verify Tables**
   - Expand `actlog` → `Schemas` → `public` → `Tables`
   - Harus ada tabel: `activity_logs`, `users`, `provinces`, `organizational_units`

### Option 2: Using psql Command Line

```bash
# Create database
psql -U postgres -c "CREATE DATABASE actlog;"

# Run migration
psql -U postgres -d actlog -f backend/migrations/001_create_tables.up.sql

# Verify
psql -U postgres -d actlog -c "\dt"
```

### Option 3: Using Automated Script

**Paling mudah - jalankan setup script:**

```powershell
cd backend\scripts
.\setup_database.ps1
```

Script akan handle semua langkah otomatis.

---

## ✅ Verify Setup

Setelah setup, test connection:

```bash
cd backend
go run cmd/api/main.go
# Atau jalankan: cd cmd/api && .\run.ps1
```

**Expected Output:**

```
✓ Connected to database: actlog
Server starting on :8080
```

Atau test dengan psql:

```bash
psql -U postgres -d actlog -c "SELECT COUNT(*) FROM activity_logs;"
```

##  Troubleshooting

### Error: "database does not exist"

Run setup script:
```powershell
cd backend\scripts
.\setup_database.ps1
```

### Error: "password authentication failed"

Update password di file `backend/.env`:
```env
DB_PASSWORD=your_actual_password
```

### Error: "psql command not found"

Tambahkan PostgreSQL bin ke PATH:
- Windows: `C:\Program Files\PostgreSQL\16\bin`
- Restart PowerShell setelah edit PATH

---

## 📚 Dokumentasi Lengkap

Untuk panduan lebih detail, lihat:
- **Team Setup Guide**: [TEAM_SETUP_GUIDE.md](TEAM_SETUP_GUIDE.md)
- **Database Documentation**: [backend/DATABASE_README.md](backend/DATABASE_README.md)
- **Scripts Guide**: [backend/scripts/README.md](backend/scripts/README.md)

---

##  Database Schema

Database: **actlog**

### Tables:

#### 1. **activity_logs**
Menyimpan log aktivitas user dari sistem BIDICS.

| Column     | Type         | Description                      |
| ---------- | ------------ | -------------------------------- |
| id         | BIGSERIAL    | Primary key (auto-generated)     |
| username   | VARCHAR(255) | Username pengguna                |
| action     | VARCHAR(100) | Activity type (LOGIN, LOGOUT, etc)|
| target     | VARCHAR(500) | Target dari aksi                 |
| ip_address | VARCHAR(45)  | IP address                       |
| user_agent | TEXT         | Browser/device info              |
| status     | VARCHAR(50)  | Status aksi                      |
| province_id| VARCHAR(10)  | ID provinsi                      |
| unit_id    | VARCHAR(50)  | ID unit organisasi               |
| session_id | VARCHAR(255) | Session ID                       |
| timestamp  | TIMESTAMP    | Activity timestamp               |

#### 2. **users**
User authentication data.

#### 3. **provinces**
Referensi provinsi Indonesia (13 provinsi sample).

#### 4. **organizational_units**
Struktur organisasi BPK (5 unit sample).

#### 5. **act_log** (Optional - dari CSV import)
Data logging import dari sistem BIDICS.

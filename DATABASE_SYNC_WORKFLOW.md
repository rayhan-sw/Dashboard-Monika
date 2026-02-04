# 🔄 Database Synchronization Workflow

Panduan untuk mensinkronkan data database antar anggota tim.

## 📋 Overview

Setelah data di DBeaver berubah, ikuti workflow ini agar semua anggota tim punya data yang **sama persis**.

---

## 👤 Untuk Person yang Update Data (Owner)

### Step 1: Export Data Terbaru

```powershell
# Pindah ke directory backend
cd backend

# Jalankan script export
.\scripts\export_current_data.ps1
```

Output yang diharapkan:
```
=== Export Database Data for Seeding ===
Database: dashboard_bpk
Host: localhost:5432
User: postgres

Exporting act_log data using pg_dump...
Running pg_dump...

✓ Success! Data exported
File: seeds\actlog_data_new.sql
Size: 15.2 MB
Lines: 150000

Next steps:
1. Review the file: seeds\actlog_data_new.sql
2. Replace old seed:
   Move-Item seeds\actlog_data_new.sql seeds\actlog_data.sql -Force
3. Test with team:
   .\scripts\setup_database.ps1
```

### Step 2: Review File Export

```powershell
# Buka file untuk quick check
code seeds\actlog_data_new.sql
```

Cek:
- ✅ Format INSERT statements benar
- ✅ Kolom sesuai: `id_trans`, `nama`, `satker`, `aktifitas`, `scope`, `lokasi`, dll
- ✅ Data terlihat valid (tidak corrupt)

### Step 3: Replace Seed File Lama

```powershell
# Backup old seed (optional)
Copy-Item seeds\actlog_data.sql seeds\actlog_data_backup_$(Get-Date -Format 'yyyyMMdd').sql

# Replace dengan data baru
Move-Item seeds\actlog_data_new.sql seeds\actlog_data.sql -Force
```

### Step 4: Test Locally

```powershell
# Drop database dan recreate dengan data baru
.\scripts\setup_database.ps1

# Verify data
psql -U postgres -d dashboard_bpk -c "SELECT COUNT(*) FROM act_log;"
```

### Step 5: Commit & Push

```powershell
# Stage changes
git add seeds\actlog_data.sql

# Commit dengan message yang jelas
git commit -m "chore: update seed data - $(Get-Date -Format 'yyyy-MM-dd')"

# Push ke repository
git push origin main
```

### Step 6: Notify Team

Kirim pesan ke tim:
```
📢 Database seed updated!
- Pull latest changes: `git pull`
- Run setup: `.\backend\scripts\setup_database.ps1`
- Data di database kalian akan sama dengan di DBeaver saya
```

---

## 👥 Untuk Anggota Tim (Receivers)

### Step 1: Pull Latest Changes

```powershell
# Pull dari repository
git pull origin main
```

### Step 2: Recreate Database

```powershell
# Pindah ke backend directory
cd backend

# Run setup script (akan drop dan recreate database)
.\scripts\setup_database.ps1
```

Dialog yang akan muncul:
```
Database 'dashboard_bpk' already exists. Drop and recreate? (yes/no): yes
```

Ketik `yes` dan Enter.

### Step 3: Verify Data

```powershell
# Check row count
psql -U postgres -d dashboard_bpk -c "SELECT COUNT(*) FROM act_log;"

# Check sample data
psql -U postgres -d dashboard_bpk -c "SELECT nama, lokasi FROM act_log LIMIT 5;"
```

### Step 4: Test Frontend

```powershell
# Start backend
cd backend\cmd\api
go run main.go

# Start frontend (terminal baru)
cd frontend
npm run dev
```

Buka browser: `http://localhost:3000/regional`

Cek:
- ✅ Peta Indonesia menampilkan data provinsi
- ✅ Data statistik sesuai
- ✅ Tidak ada error di console

---

## 🚨 Troubleshooting

### pg_dump not found

**Error:**
```
Warning: pg_dump not found in PATH
```

**Fix:**
1. Install PostgreSQL (sudah include pg_dump)
2. Add ke PATH:
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```
3. Restart PowerShell
4. Test: `pg_dump --version`

### Export file kosong atau error

**Possible causes:**
- Database connection gagal
- Credentials salah di `.env`
- Table `act_log` kosong

**Fix:**
```powershell
# Test koneksi manual
psql -h localhost -U postgres -d dashboard_bpk -c "\dt"

# Check data ada
psql -h localhost -U postgres -d dashboard_bpk -c "SELECT COUNT(*) FROM act_log;"
```

### Seed import failed

**Error:**
```
ERROR: duplicate key value violates unique constraint "act_log_pkey"
```

**Fix:**
Drop database dulu sebelum import:
```powershell
# Drop database
psql -U postgres -c "DROP DATABASE IF EXISTS dashboard_bpk;"

# Run setup lagi
.\scripts\setup_database.ps1
```

### Data tidak sama setelah pull

**Symptoms:**
- Row count berbeda
- Provinsi tertentu missing

**Fix:**
```powershell
# 1. Hard reset seed
git checkout HEAD -- seeds\actlog_data.sql

# 2. Pull lagi
git pull --force

# 3. Drop dan setup ulang
psql -U postgres -c "DROP DATABASE IF EXISTS dashboard_bpk;"
.\scripts\setup_database.ps1
```

---

## 📊 Verification Checklist

Setelah sync, pastikan:

- [ ] Database ada dan accessible
- [ ] Table `act_log` ada
- [ ] Row count sama dengan ekspektasi owner
- [ ] Sample data query berjalan
- [ ] Backend API bisa query data
- [ ] Frontend menampilkan data di peta
- [ ] Tidak ada error di console

---

## 🔐 Best Practices

### For Owner (yang update data):
1. ✅ Always test locally sebelum push
2. ✅ Commit message jelas dengan tanggal
3. ✅ Backup seed file lama sebelum replace
4. ✅ Notify team di chat setelah push

### For Team (yang terima update):
1. ✅ Backup local data penting sebelum pull
2. ✅ Always pull sebelum start development
3. ✅ Test backend & frontend setelah setup
4. ✅ Report issues jika data tidak match

---

## 📅 Regular Sync Schedule

**Recommended:**
- Daily: Pull updates every morning
- Weekly: Full database reset dan reseed
- Monthly: Review dan cleanup old backups

---

## 🆘 Need Help?

1. Check scripts README: `backend\scripts\README.md`
2. Check database docs: `backend\DATABASE_README.md`
3. Ask di group chat dengan error message lengkap
4. Tag owner untuk klarifikasi data

---

**Last Updated:** February 2026
**Maintained by:** Dashboard BPK Team


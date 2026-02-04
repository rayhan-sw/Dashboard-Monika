# 🚀 Tutorial Setup Database untuk Tim - Dashboard BPK

**Panduan lengkap untuk anggota tim yang ingin setup database PostgreSQL project Dashboard BPK.**

---

## 📋 Yang Kamu Butuhkan

1. ✅ **PostgreSQL** sudah terinstall
2. ✅ **Git** untuk clone repository
3. ✅ Koneksi internet untuk clone repo

---

## 🎯 Langkah Setup (5 Menit)

### **Step 1: Clone Repository**

```powershell
# Buka PowerShell atau Command Prompt
git clone https://github.com/rayhan-sw/Dashboard-BPK.git
cd Dashboard-BPK
```

### **Step 2: Masuk ke Folder Scripts**

```powershell
cd backend\scripts
```

### **Step 3: Jalankan Setup Database**

```powershell
.\setup_database.ps1
```

Script ini akan:
- ✅ Membuat database `actlog`
- ✅ Membuat semua tabel (users, provinces, organizational_units, act_log)
- ✅ Insert data default (admin user, provinces, organizational units)
- ✅ Verifikasi bahwa semuanya berhasil

**Output yang benar:**
```
========================================
   Dashboard BPK - Database Setup
========================================

[1/6] Checking if database exists...
[2/6] Creating database 'actlog'...
      ✓ Database created successfully
[3/6] Running migrations (creating tables)...
      ✓ Tables and indexes created
[4/6] Checking for act_log table...
[5/6] Seeding data...
      ✓ Seed data inserted
[6/6] Verifying setup...
      Tables created: 4
      
========================================
   ✓ Database Setup Complete!
========================================
```

### **Step 4: Import Data act_log (Opsional)**

Jika ada file `actlog_data.sql` yang berisi data real:

```powershell
.\import_actlog.ps1
```

Ini akan import data act_log dari file seed.

### **Step 5: Setup Environment Variables**

Buat file `.env` di folder `backend/`:

```powershell
cd ..\..
cd backend
notepad .env
```

Isi dengan:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=actlog

API_PORT=8080
JWT_SECRET=your_secret_key_here
```

**Ganti `your_password_here` dengan password PostgreSQL kamu!**

### **Step 6: Test Backend**

```powershell
cd cmd\api
.\run.ps1
```

Jika berhasil, kamu akan lihat:
```
✓ Connected to database: actlog
Server starting on :8080
```

Buka browser: http://localhost:8080/api/health

---

## 🎉 Selesai!

Database kamu sekarang sudah:
- ✅ Persis sama dengan punya owner
- ✅ Punya data default yang sama
- ✅ Siap untuk development

---

## ⚠️ Troubleshooting

### Problem: "psql is not recognized"

**Penyebab:** PostgreSQL tidak ada di PATH

**Solusi:**
1. Cari folder PostgreSQL bin: `C:\Program Files\PostgreSQL\16\bin`
2. Tambahkan ke System Environment Variables → PATH
3. Restart PowerShell
4. Test: `psql --version`

**Cara tambah ke PATH (Windows):**
1. Windows + R → ketik `sysdm.cpl`
2. Tab "Advanced" → Environment Variables
3. Di "System Variables", cari "Path" → Edit
4. New → paste: `C:\Program Files\PostgreSQL\16\bin`
5. OK → OK → Restart PowerShell

---

### Problem: "Database already exists"

**Penyebab:** Database sudah dibuat sebelumnya

**Solusi:**
```powershell
# Drop database lama
psql -U postgres -c "DROP DATABASE actlog;"

# Jalankan setup lagi
.\setup_database.ps1
```

Atau ketika ditanya script, pilih `yes` untuk drop dan recreate.

---

### Problem: "Connection refused"

**Penyebab:** PostgreSQL service tidak running

**Solusi:**
1. Windows + R → ketik `services.msc`
2. Cari service "postgresql-x64-XX"
3. Klik kanan → Start
4. Set Startup Type = Automatic

---

### Problem: "Password authentication failed"

**Penyebab:** Password salah atau belum di-set

**Solusi 1 - Reset password:**
```powershell
psql -U postgres
# Di psql prompt:
ALTER USER postgres PASSWORD 'your_new_password';
\q
```

**Solusi 2 - Edit pg_hba.conf:**
1. Buka: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`
2. Ubah method dari `md5` ke `trust` untuk local connections
3. Restart PostgreSQL service
4. Setelah bisa login, set password baru
5. Kembalikan method ke `md5`

---

## 📁 Struktur Database

Setelah setup, kamu akan punya tabel:

### 1. **users**
- Admin default: username=`admin`, password=`admin123`
- **PENTING:** Ganti password admin setelah login!

### 2. **provinces**
- 13 provinsi sample (Aceh, Sumut, Sumbar, DKI Jakarta, dll)

### 3. **organizational_units**
- 5 unit organisasi BPK sample

### 4. **act_log**
- Kosong (akan terisi dari tracking user activity)

### 5. **act_log** (jika di-import)
- Data logging dari sistem BIDICS

---

## 🔄 Update Database dari Git

Jika owner update schema atau data:

```powershell
# Pull perubahan terbaru
git pull

# Jalankan migration baru (jika ada)
cd backend\scripts
.\setup_database.ps1

# Atau manual:
psql -U postgres -d actlog -f ..\migrations\002_new_migration.up.sql
```

---

## 📞 Butuh Bantuan?

1. Cek dokumentasi lengkap: `backend/DATABASE_README.md`
2. Lihat script documentation: `backend/scripts/README.md`
3. Contact team lead atau owner repository

---

**Dibuat oleh:** Rayhan SW  
**Tanggal:** 31 Januari 2026  
**Repository:** https://github.com/rayhan-sw/Dashboard-BPK


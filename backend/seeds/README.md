# Backend Seeds

Folder ini berisi seed data untuk database PostgreSQL.

## 📁 Files

### `actlog_data.sql`
Data untuk tabel `act_log` yang di-import dari sistem BIDICS.

**How to export (for database owner):**
```powershell
cd backend/scripts
.\export_actlog_data.ps1
```

**How to import (for team members):**
```powershell
cd backend/scripts
.\import_actlog.ps1
```

---

## 🔄 Workflow untuk Sharing Data

### Untuk Pemilik Database (Owner):

1. **Export data terbaru:**
   ```powershell
   cd backend/scripts
   .\export_actlog_data.ps1
   ```

2. **Commit dan push:**
   ```bash
   git add backend/seeds/actlog_data.sql
   git commit -m "Update actlog seed data"
   git push
   ```

### Untuk Anggota Tim:

1. **Pull data terbaru:**
   ```bash
   git pull
   ```

2. **Import ke database lokal:**
   ```powershell
   cd backend/scripts
   .\import_actlog.ps1
   ```

---

## ⚠️ Important Notes

- **File size:** Jika data sangat besar (>10MB), pertimbangkan untuk:
  - Tidak commit ke Git
  - Share via Google Drive / OneDrive
  - Tambahkan `actlog_data.sql` ke `.gitignore`
  
- **Data privacy:** Pastikan tidak ada data sensitif sebelum commit ke public repository

- **Compression:** Untuk file besar, compress dulu:
  ```powershell
  Compress-Archive -Path actlog_data.sql -DestinationPath actlog_data.zip
  ```

---

## 📊 Expected Data

Tabel `act_log` biasanya berisi:
- User activity logs
- Login/logout records
- System access logs
- Error logs

Schema tergantung dari struktur CSV/Excel yang di-import.

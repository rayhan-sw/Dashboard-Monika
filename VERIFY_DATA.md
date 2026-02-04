# 🔍 Cara Memastikan Data Sama (Data Verification Guide)

Gunakan command berikut untuk memastikan database kamu sama persis dengan teman-temanmu.

## Quick Verification Commands

### 1. ✅ Cek Total Row Count
```sql
SELECT COUNT(*) FROM act_log;
```
**Expected Result:** `72034` rows

---

### 2. ✅ Cek Unique Clusters
```sql
SELECT DISTINCT cluster 
FROM act_log 
ORDER BY cluster;
```
**Expected Result:** 13 clusters
```
aida
Bantuan sosial dan subsidi
Data berbasis wilayah
economic
eksekutif
FSVA
idance
ipm
kelembagaan
pemda
pencarian
peta pembagian nasional
pusat
```

---

### 3. ✅ Cek Cluster Distribution (Jumlah Data per Cluster)
```sql
SELECT 
    cluster,
    COUNT(*) as total_rows
FROM act_log
GROUP BY cluster
ORDER BY total_rows DESC;
```

---

### 4. ✅ Cek Province Distribution (Top 10 Provinsi)
```sql
SELECT 
    province,
    COUNT(*) as total_activities
FROM act_log
WHERE province IS NOT NULL
GROUP BY province
ORDER BY total_activities DESC
LIMIT 10;
```

---

### 5. ✅ Cek Date Range
```sql
SELECT 
    MIN(tanggal) as earliest_date,
    MAX(tanggal) as latest_date,
    COUNT(DISTINCT DATE(tanggal)) as total_days
FROM act_log;
```

---

### 6. ✅ Cek Struktur Kolom Table
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'act_log'
ORDER BY ordinal_position;
```
**Expected Columns:** 18 kolom
```
id, id_trans, nama, satker, aktifitas, scope, lokasi, 
cluster, tanggal, token, province, region, 
email, eselon, status, detail_aktifitas, 
created_at, updated_at
```

---

### 7. ✅ Cek Sample Data (5 Random Rows)
```sql
SELECT 
    nama, 
    satker, 
    aktifitas, 
    cluster, 
    province,
    tanggal
FROM act_log
ORDER BY RANDOM()
LIMIT 5;
```

---

## 🚀 Cara Cepat Verifikasi di PowerShell

Simpan command ini sebagai **verify-database.ps1**:

```powershell
# Quick Database Verification Script
$ErrorActionPreference = "Stop"

Write-Host "=== Database Verification ===" -ForegroundColor Cyan

# Load .env
$envContent = Get-Content "backend\.env" -Raw
$dbHost = if ($envContent -match 'DB_HOST=([^\r\n]+)') { $matches[1].Trim() } else { "localhost" }
$dbPort = if ($envContent -match 'DB_PORT=([^\r\n]+)') { $matches[1].Trim() } else { "5432" }
$dbUser = if ($envContent -match 'DB_USER=([^\r\n]+)') { $matches[1].Trim() } else { "postgres" }
$dbName = if ($envContent -match 'DB_NAME=([^\r\n]+)') { $matches[1].Trim() } else { "dashboard_bpk" }

Write-Host "`n[1/5] Checking total rows..." -ForegroundColor Yellow
$rowCount = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c "SELECT COUNT(*) FROM act_log;"
Write-Host "Total rows: $($rowCount.Trim())" -ForegroundColor Green

Write-Host "`n[2/5] Checking clusters..." -ForegroundColor Yellow
$clusters = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c "SELECT COUNT(DISTINCT cluster) FROM act_log;"
Write-Host "Total clusters: $($clusters.Trim())" -ForegroundColor Green

Write-Host "`n[3/5] Checking columns..." -ForegroundColor Yellow
$columns = psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'act_log';"
Write-Host "Total columns: $($columns.Trim())" -ForegroundColor Green

Write-Host "`n[4/5] Checking date range..." -ForegroundColor Yellow
psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -c "SELECT MIN(tanggal) as earliest, MAX(tanggal) as latest FROM act_log;"

Write-Host "`n[5/5] Cluster distribution..." -ForegroundColor Yellow
psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -c "SELECT cluster, COUNT(*) as total FROM act_log GROUP BY cluster ORDER BY total DESC;"

Write-Host "`n✓ Verification completed!" -ForegroundColor Green
```

**Run:**
```powershell
.\verify-database.ps1
```

---

## 📊 Expected Results Summary

| Check | Expected Value |
|-------|---------------|
| **Total Rows** | 72,034 |
| **Clusters** | 13 clusters |
| **Columns** | 18 columns |
| **Provinces with Data** | ~20-25 provinces |
| **Date Range** | Check your actual data |

---

## ⚠️ Troubleshooting

### Jika Row Count Berbeda:
```sql
-- Cek apakah ada duplicate data
SELECT id_trans, COUNT(*) 
FROM act_log 
GROUP BY id_trans 
HAVING COUNT(*) > 1;
```

### Jika Cluster Berbeda:
```sql
-- List all clusters dengan jumlah data
SELECT cluster, COUNT(*) as total
FROM act_log
GROUP BY cluster
ORDER BY cluster;
```

### Jika Province NULL Banyak:
```sql
-- Cek berapa banyak NULL provinces
SELECT 
    COUNT(CASE WHEN province IS NULL THEN 1 END) as null_provinces,
    COUNT(CASE WHEN province IS NOT NULL THEN 1 END) as with_provinces,
    COUNT(*) as total
FROM act_log;
```

---

## 💡 Pro Tips

1. **Cek sebelum dan sesudah setup:**
   ```sql
   -- Sebelum setup (harusnya 0)
   SELECT COUNT(*) FROM act_log;
   
   -- Sesudah setup (harusnya 72034)
   SELECT COUNT(*) FROM act_log;
   ```

2. **Compare dengan teman:**
   - Minta teman export hasil query yang sama
   - Bandingkan row count per cluster
   - Pastikan date range sama

3. **Cek checksum (advanced):**
   ```sql
   SELECT MD5(STRING_AGG(id_trans::TEXT, ',' ORDER BY id_trans)) as data_checksum
   FROM act_log;
   ```
   Hasil MD5 harusnya sama jika data identik!

---

## 📝 Quick Reference

**After Setup:**
```powershell
# Check if table exists
psql -U postgres -d dashboard_bpk -c "\dt act_log"

# Check row count
psql -U postgres -d dashboard_bpk -c "SELECT COUNT(*) FROM act_log;"

# Check structure
psql -U postgres -d dashboard_bpk -c "\d act_log"
```

**If Data Missing:**
```powershell
# Re-run seeds
cd backend
psql -U postgres -d dashboard_bpk -f seeds/actlog_data.sql
```

---

**Need help?** Check [DATABASE_SYNC_WORKFLOW.md](DATABASE_SYNC_WORKFLOW.md) for detailed troubleshooting.

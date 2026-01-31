# 🚀 Database Setup Instructions

## Step-by-Step Guide untuk Setup Database

### Option 1: Using DBeaver (RECOMMENDED)

1. **Buka DBeaver**
   - Connect ke PostgreSQL server (localhost:5432)
   - User: `postgres`
   - Password: `12345678`

2. **Create Database**
   - Klik kanan pada "Databases" → "Create New Database"
   - Database name: `dashboard_bpk`
   - Encoding: `UTF8`
   - Klik "OK"

3. **Run Migration Script**
   - Buka database `dashboard_bpk`
   - Klik "SQL Editor" (atau tekan F3)
   - Copy paste isi file: `setup-database.sql`
   - Execute script (Ctrl+Enter atau tombol Play ▶️)
   - Verify: Lihat message "Database setup completed successfully!"

4. **Verify Tables**
   - Expand "dashboard_bpk" → "Schemas" → "public" → "Tables"
   - Harus ada table `activity_logs`

### Option 2: Using psql Command Line

```bash
# Create database
psql -U postgres -c "CREATE DATABASE dashboard_bpk;"

# Run migration
psql -U postgres -d dashboard_bpk -f setup-database.sql
```

### Option 3: Jalankan Script di DBeaver secara Manual

**Script SQL** (copy paste ke SQL Editor DBeaver):

```sql
-- 1. Create database (jika belum ada)
-- Jalankan ini di database 'postgres' default
CREATE DATABASE dashboard_bpk
    WITH
    ENCODING = 'UTF8'
    TEMPLATE = template0;

-- 2. Switch ke database dashboard_bpk
-- (klik kanan connection → Switch Database → dashboard_bpk)

-- 3. Create table activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_trans UUID UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    satker VARCHAR(255),
    aktifitas VARCHAR(100) NOT NULL,
    scope TEXT,
    lokasi VARCHAR(255),
    cluster VARCHAR(50) NOT NULL,
    tanggal TIMESTAMPTZ NOT NULL,
    token UUID,
    province VARCHAR(100),
    region VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX idx_activity_logs_tanggal ON activity_logs(tanggal);
CREATE INDEX idx_activity_logs_cluster ON activity_logs(cluster);
CREATE INDEX idx_activity_logs_satker ON activity_logs(satker);
CREATE INDEX idx_activity_logs_aktifitas ON activity_logs(aktifitas);

-- 5. Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger
CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Verify Setup

Setelah setup, test connection dengan command:

```bash
cd backend
go run test-db-connection.go
```

**Expected Output:**

```
Database connection successful!
 PostgreSQL Version: PostgreSQL 15.x
 Table 'activity_logs' exists
 Records in activity_logs: 0
```

##  Troubleshooting

### Error: "database does not exist"

- Pastikan sudah create database `dashboard_bpk`
- Check di DBeaver: Database list harus ada `dashboard_bpk`

### Error: "password authentication failed"

- Update password di file `backend/.env`:
  ```
  DB_PASSWORD=12345678
  ```

### Error: "table already exists"

- Skip error ini, artinya table sudah dibuat sebelumnya
- Check dengan query: `SELECT * FROM activity_logs LIMIT 1;`

##  Database Schema

Table: **activity_logs**

| Column     | Type         | Description                      |
| ---------- | ------------ | -------------------------------- |
| id         | UUID         | Primary key (auto-generated)     |
| id_trans   | UUID         | Transaction ID dari CSV (unique) |
| nama       | VARCHAR(255) | Masked username                  |
| satker     | VARCHAR(255) | Unit kerja                       |
| aktifitas  | VARCHAR(100) | Activity type                    |
| scope      | TEXT         | Activity details                 |
| lokasi     | VARCHAR(255) | Location                         |
| cluster    | VARCHAR(50)  | pencarian/pemda/pusat            |
| tanggal    | TIMESTAMPTZ  | Activity timestamp               |
| token      | UUID         | Session token                    |
| province   | VARCHAR(100) | Province (extracted from satker) |
| region     | VARCHAR(50)  | Region grouping                  |
| created_at | TIMESTAMPTZ  | Record creation time             |
| updated_at | TIMESTAMPTZ  | Last update time                 |

---

**Next Step**: Import CSV data (actLog_202601091608.csv)

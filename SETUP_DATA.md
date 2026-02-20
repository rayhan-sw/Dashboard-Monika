# Setup Data — Agar Data DB Sama Persis

Struktur tabel ada di Git (migration), tapi **isi data** tidak. Dokumen ini menjelaskan cara **export** data dari DB kamu dan cara **teman** **import** agar dapat data sama persis.

---

## Untuk Kamu (Pemilik Data): Export

### Opsi A: Script (disarankan)

1. Pastikan **PostgreSQL client** ada di PATH (`pg_dump`). (Biasanya sudah ada kalau PostgreSQL server terpasang.)
2. Dari **root repo** jalankan:

   **Windows (PowerShell):**
   ```powershell
   .\scripts\export-db.ps1
   ```

   **Linux / macOS:**
   ```bash
   chmod +x scripts/export-db.sh
   ./scripts/export-db.sh
   ```

3. Hasil: file **`backend/seeds/daring_bpk_data.dump`** (data-only, format custom untuk `pg_restore`).

4. **Berbagi file ke teman:**
   - Jika file **kecil** (< ~10 MB): bisa di Git LFS atau commit (pastikan tidak di-ignore).
   - Jika file **besar**: jangan commit. Kirim lewat Google Drive / OneDrive / link, lalu beri tahu teman simpan di `backend/seeds/daring_bpk_data.dump`.

### Opsi B: Manual pakai DBeaver

1. Klik kanan database **`daring_bpk`** → **Tools** → **Backup database** (atau **Export**).
2. Pilih **Data only** (jangan export schema).
3. Format: pilih **Custom** (binary) supaya bisa di-restore dengan `pg_restore`, atau **Plain** (SQL) kalau mau satu file `.sql`.
4. Simpan sebagai `backend/seeds/daring_bpk_data.dump` (custom) atau `daring_bpk_data.sql` (plain).
5. Kalau pakai **Plain SQL**, teman bisa restore dengan:
   ```bash
   psql -h localhost -U postgres -d daring_bpk -f backend/seeds/daring_bpk_data.sql
   ```
   (Jalankan **setelah** migrasi.)

### Opsi C: Manual pakai pg_dump (terminal)

Dari root repo, dengan `.env` di `backend/` sudah berisi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`:

```powershell
# Windows
$env:PGPASSWORD = "isi_password"
pg_dump -h localhost -p 5432 -U postgres -d daring_bpk --data-only --no-owner -Fc -f backend/seeds/daring_bpk_data.dump
```

```bash
# Linux/macOS
export PGPASSWORD="isi_password"
pg_dump -h localhost -p 5432 -U postgres -d daring_bpk --data-only --no-owner -Fc -f backend/seeds/daring_bpk_data.dump
```

---

## Untuk Teman: Import (dapat data sama persis)

1. **Clone/pull** repo dan siapkan env:
   - Buat database kosong: `createdb -U postgres daring_bpk` (atau nama sesuai `DB_NAME`).
   - Salin `backend/.env.example` → `backend/.env`
   - Isi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` untuk DB lokal teman.

2. **Dapatkan file dump** dari kamu:
   - File: **`daring_bpk_data.dump`**
   - Simpan di: **`backend/seeds/daring_bpk_data.dump`**
   - (Kalau dapat file `.sql`, simpan di `backend/seeds/` dan lihat langkah alternatif di bawah.)

3. Dari **root repo** jalankan:

   **Windows (PowerShell):**
   ```powershell
   .\scripts\import-db.ps1
   ```

   **Linux / macOS:**
   ```bash
   chmod +x scripts/import-db.sh
   ./scripts/import-db.sh
   ```

   Script akan:
   - menjalankan **migrasi** (`go run cmd/migrate/main.go`), lalu
   - **memuat data** dari `backend/seeds/daring_bpk_data.dump` ke DB.

4. Selesai. Isi tabel di DB teman sekarang sama dengan sumber dump.  
   (Beberapa peringatan dari `pg_restore`—misalnya tentang role—bisa diabaikan asal tidak ada error yang menghentikan proses.)

### Jika dapat file .sql (bukan .dump)

1. Pastikan migrasi sudah jalan: `cd backend && go run cmd/migrate/main.go`
2. Restore data:
   ```bash
   psql -h localhost -U postgres -d daring_bpk -f backend/seeds/daring_bpk_data.sql
   ```
   (Sesuaikan `-h` / `-U` / `-d` dengan `backend/.env`.)

---

## File besar & .gitignore

- **`backend/seeds/daring_bpk_data.dump`** dan **`backend/seeds/*_data.sql`** sudah di-ignore di `.gitignore` agar repo tidak penuh.
- Untuk berbagi: kirim file lewat drive/link atau pakai Git LFS kalau tim setuju.

---

## Ringkasan

| Peran   | Langkah |
|--------|--------|
| **Kamu** | Jalankan `scripts/export-db.ps1` (atau `.sh`) → dapat `backend/seeds/daring_bpk_data.dump` → kirim file ke teman. |
| **Teman** | Simpan dump di `backend/seeds/daring_bpk_data.dump` → jalankan `scripts/import-db.ps1` (atau `.sh`) → selesai. |

Migrasi tetap dijalankan (oleh script import) supaya schema selalu mengikuti kode di Git; dump hanya mengisi **data**.

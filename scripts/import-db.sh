#!/usr/bin/env bash
# Import data-only dump ke PostgreSQL daring_bpk (untuk teman yang mau data sama).
# Jalankan dari root repo. Membaca backend/.env untuk koneksi DB.
# Prasyarat: file backend/seeds/daring_bpk_data.dump sudah ada (dari kamu atau minta ke pemilik repo).

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/backend/.env"
DUMP_FILE="$REPO_ROOT/backend/seeds/daring_bpk_data.dump"
BACKEND_DIR="$REPO_ROOT/backend"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: File tidak ditemukan: $ENV_FILE (salin dari backend/.env.example dan isi DB_*)"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "Error: File dump tidak ditemukan: $DUMP_FILE"
  echo "Minta file daring_bpk_data.dump ke pemilik repo, lalu simpan di backend/seeds/"
  exit 1
fi

# Load .env
set -a
while IFS= read -r line; do
  line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  if [ -n "$line" ] && ! echo "$line" | grep -q '^#' ; then
    if echo "$line" | grep -q '=' ; then
      export "$line"
    fi
  fi
done < "$ENV_FILE"
set +a

export PGHOST="${DB_HOST:-localhost}"
export PGPORT="${DB_PORT:-5432}"
export PGUSER="${DB_USER:-postgres}"
export PGPASSWORD="$DB_PASSWORD"
export PGDATABASE="${DB_NAME:-daring_bpk}"

echo "1/2 Menjalankan migrasi..."
(cd "$BACKEND_DIR" && go run cmd/migrate/main.go)

echo "2/2 Memuat data dari dump: $DUMP_FILE"
pg_restore --data-only --no-owner --no-privileges --disable-triggers -d "$PGDATABASE" "$DUMP_FILE" 2>/dev/null || \
pg_restore --data-only --no-owner --no-privileges -d "$PGDATABASE" "$DUMP_FILE"

echo "Selesai. Data di DB $PGDATABASE sekarang sama dengan sumber dump."

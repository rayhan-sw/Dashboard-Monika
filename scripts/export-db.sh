#!/usr/bin/env bash
# Export data-only dump dari PostgreSQL daring_bpk (untuk dibagikan ke teman).
# Jalankan dari root repo. Membaca backend/.env untuk koneksi DB.
# Hasil: backend/seeds/daring_bpk_data.dump

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/backend/.env"
OUT_DIR="$REPO_ROOT/backend/seeds"
OUT_FILE="$OUT_DIR/daring_bpk_data.dump"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: File tidak ditemukan: $ENV_FILE (buat dari backend/.env.example)"
  exit 1
fi

# Load .env (export KEY=value, skip comment dan kosong)
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

if [ -z "$DB_NAME" ]; then
  echo "Error: DB_NAME tidak ada di .env"
  exit 1
fi

mkdir -p "$OUT_DIR"
export PGHOST="${DB_HOST:-localhost}"
export PGPORT="${DB_PORT:-5432}"
export PGUSER="${DB_USER:-postgres}"
export PGPASSWORD="$DB_PASSWORD"
export PGDATABASE="$DB_NAME"

echo "Export data-only dari database: $DB_NAME (host=$PGHOST port=$PGPORT user=$PGUSER)"
echo "Output: $OUT_FILE"

pg_dump --data-only --no-owner --no-privileges -Fc -f "$OUT_FILE"

echo "Selesai. Ukuran file: $(du -h "$OUT_FILE" | cut -f1)"

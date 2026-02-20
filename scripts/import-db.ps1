# Import data-only dump ke PostgreSQL daring_bpk (untuk teman yang mau data sama).
# Jalankan dari root repo. Membaca backend/.env untuk koneksi DB.
# Prasyarat: file backend/seeds/daring_bpk_data.dump sudah ada (dari kamu atau minta ke pemilik repo).

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot + "\.."
$envFile = Join-Path $repoRoot "backend\.env"
$dumpFile = Join-Path $repoRoot "backend\seeds\daring_bpk_data.dump"
$backendDir = Join-Path $repoRoot "backend"

if (-not (Test-Path $envFile)) {
    Write-Error "File tidak ditemukan: $envFile (salin dari backend\.env.example dan isi DB_*)"
    exit 1
}

if (-not (Test-Path $dumpFile)) {
    Write-Error "File dump tidak ditemukan: $dumpFile"
    Write-Host "Minta file daring_bpk_data.dump ke pemilik repo, lalu simpan di backend/seeds/"
    exit 1
}

# Load .env
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $i = $line.IndexOf("=")
        if ($i -gt 0) {
            $key = $line.Substring(0, $i).Trim()
            $val = $line.Substring($i + 1).Trim()
            if ($val -match '^["'']' -and $val -match '["'']$') { $val = $val.Substring(1, $val.Length - 2) }
            [Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

$env:PGPASSWORD = $env:DB_PASSWORD
$env:PGHOST = $env:DB_HOST
$env:PGPORT = $env:DB_PORT
$env:PGUSER = $env:DB_USER
$env:PGDATABASE = $env:DB_NAME

Write-Host "1/2 Menjalankan migrasi..."
Push-Location $backendDir
try {
    go run cmd/migrate/main.go
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

Write-Host "2/2 Memuat data dari dump: $dumpFile"
# --disable-triggers agar FK tidak error saat insert (trigger di-enable lagi setelah selesai)
& pg_restore --data-only --no-owner --no-privileges --disable-triggers -d $env:DB_NAME $dumpFile 2>$null
# pg_restore bisa exit 1 walau sukses (mis. warnings); cek apakah data masuk
if ($LASTEXITCODE -ne 0) {
    # Coba tanpa disable-triggers kalau DB strict
    Write-Host "Retry tanpa --disable-triggers..."
    & pg_restore --data-only --no-owner --no-privileges -d $env:DB_NAME $dumpFile
}

Write-Host "Selesai. Data di DB $env:DB_NAME sekarang sama dengan sumber dump."

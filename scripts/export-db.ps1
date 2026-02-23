# Export data-only dump dari PostgreSQL daring_bpk (untuk dibagikan ke teman).
# Jalankan dari root repo. Membaca backend/.env untuk koneksi DB.
# Hasil: backend/seeds/daring_bpk_data.dump

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot + "\.."
$envFile = Join-Path $repoRoot "backend\.env"
$outDir = Join-Path $repoRoot "backend\seeds"
$outFile = Join-Path $outDir "daring_bpk_data.dump"

if (-not (Test-Path $envFile)) {
    Write-Error "File tidak ditemukan: $envFile (buat dari backend\.env.example)"
    exit 1
}

# Load .env (format KEY=value, skip comment dan kosong)
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

$dbHost = $env:DB_HOST
$port = $env:DB_PORT
$user = $env:DB_USER
$pass = $env:DB_PASSWORD
$name = $env:DB_NAME

if (-not $name) {
    Write-Error "DB_NAME tidak ada di .env"
    exit 1
}

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$env:PGPASSWORD = $pass
$env:PGHOST = $dbHost
$env:PGPORT = $port
$env:PGUSER = $user
$env:PGDATABASE = $name

# Cari pg_dump: dari PATH atau lokasi instalasi PostgreSQL di Windows
$pgDump = $null
if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    $pgDump = "pg_dump"
}
if (-not $pgDump) {
    $pgBins = @(
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
    )
    $found = Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue | ForEach-Object {
        $exe = Join-Path $_.FullName "bin\pg_dump.exe"
        if (Test-Path $exe) { $exe }
    } | Select-Object -First 1
    if ($found) { $pgDump = $found }
}
if (-not $pgDump) {
    Write-Error "pg_dump tidak ditemukan. Tambahkan folder bin PostgreSQL ke PATH (mis. C:\Program Files\PostgreSQL\16\bin) atau export manual lewat DBeaver (lihat SETUP_DATA.md)."
    exit 1
}

Write-Host "Export data-only dari database: $name (host=$dbHost port=$port user=$user)"
Write-Host "Output: $outFile"

& $pgDump --data-only --no-owner --no-privileges -Fc -f $outFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump gagal."
    exit $LASTEXITCODE
}

Write-Host "Selesai. Ukuran file: $((Get-Item $outFile).Length / 1MB) MB"

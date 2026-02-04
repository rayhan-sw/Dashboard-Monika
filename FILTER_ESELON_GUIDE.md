# Filter Eselon - Halaman Regional

## Overview

Telah ditambahkan filter Eselon khusus untuk halaman **Analisis Organisasi & Regional**. Filter ini memungkinkan pengguna untuk memfilter data berdasarkan tingkat eselon (I, II, III, IV, V, atau Eksternal).

## Perubahan yang Dilakukan

### 1. Frontend

#### A. Halaman Regional (`frontend/src/app/regional/page.tsx`)

- ✅ Menambahkan state `selectedEselon` dengan default "Semua Eselon"
- ✅ Menambahkan UI Filter Eselon di atas konten (setelah page header)
- ✅ Update semua API calls untuk include parameter `eselon`:
  - `regionalService.getUnits()`
  - `regionalService.getLocations()`
  - `regionalService.getTopContributors()`
  - `regionalService.getUnitHourlyData()`
  - `dashboardService.getHourlyChart()`
- ✅ Menambahkan `selectedEselon` ke dependencies `useEffect`

#### B. API Service (`frontend/src/services/api.ts`)

Update semua regional service methods untuk support parameter `eselon`:

- ✅ `getHourlyChart()`
- ✅ `getLocations()`
- ✅ `getUnits()`
- ✅ `getUnitHourlyData()`
- ✅ `getTopContributors()`

### 2. Backend

#### A. Repository (`backend/internal/repository/activity_log_repository.go`)

- ✅ Update interface `ActivityLogRepository` untuk include parameter `eselon`
- ✅ Menambahkan helper function `applyEselonFilter()`
- ✅ Update semua method untuk support filter eselon:
  - `GetTotalCount()`
  - `GetCountByStatus()`
  - `GetRecentActivities()`
  - `GetActivityCountByScope()`
  - `GetActivityCountByHour()`
  - `GetActivityCountByHourForSatker()`
  - `GetActivityCountByProvince()`
  - `GetActivityCountByLokasi()`
  - `GetActivityCountBySatker()`
  - `GetBusiestHour()`
  - `GetAccessSuccessRateByDate()`
  - `GetUniqueUsersCount()`
  - `GetTopContributors()`
  - `GetLogoutErrors()`

#### B. Handler (`backend/internal/handler/dashboard_handler.go`)

- ✅ Update semua handler functions untuk parse dan forward parameter `eselon`:
  - `GetDashboardStats()`
  - `GetActivities()`
  - `GetChartData()`
  - `GetAccessSuccessRate()`
  - `GetProvinces()`
  - `GetLokasi()`
  - `GetUnits()`
  - `GetHourlyDataForSatker()`
  - `GetTopContributors()`
  - `GetLogoutErrors()`

## UI Filter Eselon

### Lokasi

Filter Eselon ditempatkan di halaman Regional, tepat di bawah page header "Analisis Organisasi & Regional".

### Desain

```tsx
<select>
  <option value="Semua Eselon">Semua Eselon</option>
  <option value="I">Eselon I</option>
  <option value="II">Eselon II</option>
  <option value="III">Eselon III</option>
  <option value="IV">Eselon IV</option>
  <option value="V">Eselon V</option>
  <option value="Eksternal">Eksternal</option>
</select>
```

### Fitur

- Dropdown select dengan 7 opsi (Semua + 5 tingkat + Eksternal)
- Tombol "Reset Filter" muncul ketika filter aktif
- Styling konsisten dengan design system (amber/orange gradient)
- Auto-refresh data ketika filter berubah

## Cara Penggunaan

### Frontend

1. Buka halaman Regional: `http://localhost:3000/regional`
2. Pilih eselon dari dropdown filter
3. Data akan otomatis ter-filter sesuai pilihan

### Backend API

Semua endpoint sekarang mendukung parameter `eselon`:

```bash
# Example: Filter by Eselon III
GET /api/regional/units?eselon=III

# Example: Filter by Eselon and Cluster
GET /api/regional/units?cluster=pencarian&eselon=II

# Example: Filter with date range and eselon
GET /api/regional/top-contributors?start_date=2022-01-01&end_date=2022-12-31&eselon=I
```

## Nilai Eselon yang Valid

- `I` - Eselon I
- `II` - Eselon II
- `III` - Eselon III
- `IV` - Eselon IV
- `V` - Eselon V
- `Eksternal` - Pengguna Eksternal
- Empty string atau tidak ada parameter = Semua Eselon

## Testing

### 1. Test Frontend

```powershell
cd frontend
npm run dev
```

Buka browser: `http://localhost:3000/regional`

### 2. Test Backend

```powershell
cd backend
go run cmd/api/main.go
```

### 3. Test API Endpoints

```powershell
# Test filter eselon
curl "http://localhost:8080/api/regional/units?eselon=III"

# Test kombinasi filter
curl "http://localhost:8080/api/regional/top-contributors?cluster=pencarian&eselon=II&limit=5"
```

## Catatan Penting

1. ✅ Filter Eselon **hanya** ada di halaman Regional (sesuai permintaan)
2. ✅ Filter Eselon **tidak** ditambahkan ke global filter (seperti tanggal dan cluster)
3. ✅ Backend sudah support eselon filter di **semua** endpoint (untuk konsistensi)
4. ✅ Filter bersifat opsional - jika tidak dipilih, akan menampilkan semua eselon
5. ✅ Kompatibel dengan filter lain (tanggal dan cluster)
6. ✅ No breaking changes - backward compatible

## Struktur Data

Field `eselon` di database:

- Type: VARCHAR(100)
- Values: "I", "II", "III", "IV", "V", "Eksternal"
- Nullable: Yes (data lama mungkin NULL)

## Manfaat

1. **Analisis Organisasi**: Dapat melihat performa berdasarkan tingkat struktural
2. **Distribusi Peran**: Memahami kontribusi setiap level eselon
3. **Granular Insights**: Kombinasi filter eselon + cluster + tanggal memberikan insight yang lebih detail
4. **Fleksibilitas**: Filter independen, tidak mengganggu filter global

## Screenshot Filter

```
┌─────────────────────────────────────────────────┐
│ Analisis Organisasi & Regional                  │
│ Analisis komprehensif kinerja unit...          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Filter Eselon: [Semua Eselon ▼] [Reset Filter] │
└─────────────────────────────────────────────────┘

[Dashboard Content...]
```

## Maintenance

Jika perlu menambahkan tingkat eselon baru:

1. **Frontend**: Update options di `regional/page.tsx`
2. **Backend**: Tidak perlu perubahan (query sudah dinamis)
3. **Database**: Pastikan nilai eselon konsisten

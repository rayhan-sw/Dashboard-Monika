# Halaman Analisis Organisasi & Regional

## Deskripsi

Halaman ini menyediakan analisis komprehensif kinerja unit organisasi, distribusi geografis, dan keterlibatan pengguna di seluruh wilayah Indonesia.

## Layout & Navigation

### Sidebar

- **Status**: ✅ Terintegrasi dengan Sidebar global
- **Fitur**:
  - Logo MONIKA di bagian atas
  - Menu navigasi:
    - Dashboard (User Monitor)
    - **Analisis Regional & Unit** (Active)
    - Analisis Konten (Content Intelligence)
    - Laporan (Reports & Export)
  - Collapsible dengan animasi smooth
  - Profile section di bagian bawah

### Header

- **Status**: ✅ Terintegrasi dengan Header global
- **Fitur**:
  - Search bar untuk mencari aktivitas, user, atau reports
  - **Date Range Picker**: Filter berdasarkan tanggal (default: 30 hari terakhir)
    - Preset: 7 hari, 30 hari, 90 hari, Custom
    - Calendar picker dengan month navigation
  - **Cluster Filter**: Filter berdasarkan cluster
    - Options: Semua Cluster, economic, pemda, pusat, pencarian
    - Live data dari API
  - Notification bell dengan badge
  - Settings icon
  - Admin User profile dengan dropdown

### Global State Management

- **Zustand Store** (`useAppStore`):
  - `selectedCluster`: Cluster yang aktif dipilih
  - `dateRange`: { startDate, endDate } untuk filter tanggal
  - `setPresetRange`: Helper untuk set 7/30/90 hari
- Filter di Header otomatis sync dengan semua komponen
- Data reload saat filter berubah

## Fitur Utama

### 1. Peringkat Kinerja Unit Kerja

- **Lokasi**: Kolom kiri atas
- **Fungsi**: Menampilkan ranking unit kerja (satker) berdasarkan aktivitas tertinggi
- **Fitur**:
  - Scrollable list dengan 4+ unit kerja
  - Badge ranking dengan nomor urut
  - Informasi waktu puncak aktivitas
  - Jumlah request per unit
  - Progress bar visualisasi performa
  - Highlight untuk unit terpilih

### 2. Peta Nusantara

- **Lokasi**: Kolom kanan atas
- **Fungsi**: Visualisasi geografis unit kerja di seluruh Indonesia
- **Status**: Placeholder (siap untuk integrasi map library)
- **Rencana**: Akan diintegrasikan dengan react-simple-maps atau library peta gratis lainnya
- **Fitur yang direncanakan**:
  - Interactive map dengan tooltip
  - Markers untuk lokasi unit kerja
  - Color coding berdasarkan volume aktivitas

### 3. Jam Operasional Unit Kerja

- **Lokasi**: Baris kedua (full width)
- **Fungsi**: Menampilkan pola puncak aktivitas per unit berdasarkan jam
- **Fitur**:
  - Unit selector (klik untuk switch unit)
  - Bar chart 24 jam (0h-23h)
  - Gradient visualization (blue to purple)
  - Y-axis dengan skala 0-20
  - Responsive hover effects
  - Selected unit highlighting

### 4. Distribusi Geografis - List View

- **Lokasi**: Kolom kiri bawah
- **Fungsi**: Breakdown aktivitas berdasarkan wilayah Indonesia
- **Fitur**:
  - 5 Region utama:
    - JAWA, BALI & NUSA TENGGARA (594)
    - SUMATERA (376)
    - SULAWESI (211)
    - KALIMANTAN (84)
    - MALUKU & PAPUA (78)
  - Detail provinsi per region
  - Status indicators (blue dots untuk provinsi unggulan)
  - Total akses: 1,018
  - Scrollable grid layout (2 kolom)

### 5. Distribusi Geografis - Pie Chart

- **Lokasi**: Kolom kanan bawah
- **Fungsi**: Visualisasi proporsi distribusi geografis
- **Fitur**:
  - SVG pie chart dengan 5 segments
  - Color coding per region:
    - Biru (#3B82F6): Jawa, Bali & Nusa Tenggara
    - Amber (#F59E0B): Sumatera
    - Purple (#8B5CF6): Sulawesi
    - Green (#10B981): Kalimantan
    - Red (#EF4444): Maluku & Papua
  - Center label dengan total
  - Legend dengan count dan percentage

### 6. Kontributor Aktivitas Teratas

- **Lokasi**: Baris terakhir (full width)
- **Fungsi**: Top 10 pengguna paling aktif
- **Fitur**:
  - Top 10 list (no pagination)
  - Masked usernames (privacy)
  - Unit kerja information
  - Request count
  - Ranking badges dengan gradient
  - Hover effects

## Data Mock

Saat ini halaman menggunakan mock data untuk development. Data dapat diganti dengan API calls pada:

- `mockPerformanceData`: Data kinerja unit
- `mockGeoData`: Data geografis per region
- `mockTopContributors`: Data kontributor teratas
- `mockHourlyData`: Data aktivitas per jam

## State Management

- `selectedUnit`: Unit yang sedang ditampilkan di chart jam operasional
- `sidebarCollapsed`: Status sidebar (collapsed/expanded)
- **Global state dari Zustand**:
  - `selectedCluster`: Filter cluster aktif
  - `dateRange`: Range tanggal untuk filtering
- Menggunakan React useState untuk interaktivitas lokal

## Styling

- **Framework**: Tailwind CSS
- **Theme**: BPK Dashboard (amber-orange gradient)
- **Components**: Custom dengan Tailwind utilities
- **Icons**: Heroicons (via inline SVG)
- **Scrollbar**: Hidden dengan custom utility class

## Responsive Design

- **Desktop**: Grid 12 kolom dengan sidebar 320px
- **Tablet**: Adjustable columns, sidebar collapsible
- **Mobile**: Stack layout (belum dioptimalkan)
- **Sidebar Transition**: Smooth 300ms transition saat collapse/expand

## Integrasi API (To-Do)

### Endpoints yang dibutuhkan:

1. `GET /api/regional/performance` - Data kinerja unit
2. `GET /api/regional/map` - Data geografis untuk peta
3. `GET /api/regional/hourly/:unitId` - Data jam operasional per unit
4. `GET /api/regional/distribution` - Data distribusi geografis
5. `GET /api/regional/top-contributors` - Data top 10 kontributor

## Improvements yang Direncanakan

1. **Peta Interaktif**: Integrasi dengan react-simple-maps
2. **Real-time Updates**: WebSocket untuk data live
3. **Filtering**: Filter berdasarkan tanggal, region
4. **Export**: Download data sebagai PDF/Excel
5. **Animations**: Smooth transitions untuk chart updates
6. **Mobile Optimization**: Responsive layout untuk mobile
7. **Accessibility**: ARIA labels dan keyboard navigation

## Navigasi

- URL: `/regional`
- Menu: "Analisis Regional & Unit" di sidebar (dengan icon users)
- Active state: Highlighted dengan background gradient orange
- Filters: Terintegrasi dengan global state untuk date range dan cluster

## Dependencies

- React 19
- Next.js App Router
- Tailwind CSS
- Heroicons (inline SVG)
- **Zustand** - Global state management
- **date-fns** - Date formatting dan manipulation
- Sidebar & Header components (shared)

## File Structure

```
frontend/src/app/regional/
├── page.tsx          # Main page component
└── (future)
    ├── components/   # Regional-specific components
    ├── hooks/        # Custom hooks untuk data fetching
    └── types/        # TypeScript interfaces
```

## Testing

- [ ] Unit tests untuk components
- [ ] Integration tests untuk API calls
- [ ] E2E tests untuk user interactions
- [ ] Visual regression tests

## Performance

- Lazy loading untuk map component
- Memoization untuk expensive calculations
- Virtual scrolling untuk long lists
- Optimized re-renders dengan React.memo

---

**Last Updated**: 2025-01-28
**Status**: ✅ Development Complete with Sidebar & Filters
**Next Phase**: API Integration & Real-time Data

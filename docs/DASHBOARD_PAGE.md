# Halaman Dashboard User Monitor

## Deskripsi

Halaman ini merupakan halaman utama untuk monitoring aktivitas pengguna sistem BIDICS BPK RI. Menyediakan overview komprehensif tentang statistik pengguna, pola aktivitas, tingkat keberhasilan akses, dan pemantauan kesalahan sistem secara real-time.

## Layout & Navigation

### Sidebar

- **Status**: Terintegrasi dengan Sidebar global
- **Fitur**:
  - Logo MONIKA di bagian atas
  - Menu navigasi:
    - **Dashboard (User Monitor)** (Active)
    - Analisis Regional & Unit
    - Analisis Konten (Content Intelligence)
    - Laporan (Reports & Export)
  - Collapsible dengan animasi smooth (80px collapsed / 320px expanded)
  - Profile section di bagian bawah

### Header

- **Status**: Terintegrasi dengan Header global
- **Fitur**:
  - Search bar untuk mencari aktivitas, user, atau reports
  - **Date Range Picker**: Filter berdasarkan tanggal
    - Preset: 7 hari, 30 hari, 90 hari, Custom
    - Calendar picker dengan month navigation
    - Default: 30 hari terakhir
  - **Cluster Filter**: Filter berdasarkan cluster
    - Options: Semua Cluster, economic, pemda, pusat, pencarian
    - Live data dari API endpoint `/api/dashboard/clusters`
  - Notification bell dengan badge
  - Settings icon
  - Admin User profile dengan dropdown

### Global State Management

- **Zustand Store** (`useAppStore`):
  - `selectedCluster`: Cluster yang aktif dipilih (string | null)
  - `dateRange`: { startDate, endDate } untuk filter tanggal
  - `setSelectedCluster`: Function untuk update cluster
  - `setDateRange`: Function untuk update date range
  - `setPresetRange`: Helper untuk set preset (7/30/90 hari)
- Filter di Header otomatis sync dengan semua komponen
- Data reload otomatis saat filter berubah

## Fitur Utama

### 1. Statistik Utama (Dashboard Stats)

**Component**: `DashboardStats.tsx`

**Lokasi**: Baris pertama (4 kartu dalam 1 baris)

**Fitur**:
- **Total Pengguna**
  - Icon: Users
  - Warna: Blue (#3B82F6)
  - Data: Jumlah unique users (berdasarkan token)
  - API: `GET /api/dashboard/stats` → `total_users`

- **Login Berhasil**
  - Icon: Check Circle
  - Warna: Green (#10B981)
  - Data: Jumlah login sukses
  - API: `GET /api/dashboard/stats` → `success_logins`

- **Total Aktivitas**
  - Icon: Activity
  - Warna: Amber (#F59E0B)
  - Data: Total semua aktivitas
  - API: `GET /api/dashboard/stats` → `total_activities`

- **Kesalahan Logout**
  - Icon: Alert Triangle
  - Warna: Red (#EF4444)
  - Data: Jumlah logout error
  - API: `GET /api/dashboard/stats` → `logout_errors`

**State Management**:
- Auto-refresh setiap data filter berubah
- Loading skeleton saat fetching
- Error handling dengan pesan user-friendly

### 2. Riwayat Aktivitas

**Component**: `ActivityTable.tsx`

**Lokasi**: Kolom kiri baris kedua (1/3 width)

**Fitur**:
- Tabel log aktivitas terbaru
- Kolom:
  - Nama pengguna
  - Satuan Kerja (Satker)
  - Aktivitas (LOGIN/LOGOUT)
  - Timestamp
- Badge status (Success/Error)
- Pagination controls
- Scrollable dengan max-height
- Hover effects

**API Integration**:
- Endpoint: `GET /api/dashboard/activities`
- Query params: `page`, `page_size`, `start_date`, `end_date`, `cluster`
- Default page_size: 10

### 3. Mode Interaksi Pengguna

**Component**: `InteractionChart.tsx`

**Lokasi**: Kolom tengah baris kedua (1/3 width)

**Fitur**:
- Donut chart distribusi aktivitas per cluster
- 4 Cluster:
  - Economic (Kuning)
  - Pemda (Biru)
  - Pusat (Ungu)
  - Pencarian (Hijau)
- Legend dengan count dan percentage
- Center label dengan total
- Interactive hover effects

**API Integration**:
- Endpoint: `GET /api/dashboard/charts/cluster`
- Response: Array of `{scope: string, count: number}`

### 4. Jam Tersibuk (Busiest Hour)

**Component**: `BusiestHourCard.tsx`

**Lokasi**: Kolom kanan baris kedua (1/3 width)

**Fitur**:
- Card menampilkan jam paling sibuk
- Format: "13:00" dengan AM/PM
- Jumlah aktivitas di jam tersebut
- Icon clock
- Gradient background

**API Integration**:
- Endpoint: `GET /api/dashboard/stats` → `busiest_hour`
- Response: `{hour: number, count: number}`

### 5. Tingkat Keberhasilan Akses

**Component**: `AccessSuccessChart.tsx`

**Lokasi**: Kolom kiri baris ketiga (1/2 width)

**Fitur**:
- Line chart multi-series (Success vs Failed)
- X-axis: Tanggal
- Y-axis: Jumlah requests
- 2 Lines:
  - Success (Hijau)
  - Failed (Merah)
- Interactive tooltip
- Grid lines untuk readability
- Legend dengan status

**API Integration**:
- Endpoint: `GET /api/dashboard/access-success`
- Query params: `start_date`, `end_date`, `cluster`
- Response: Array of `{date: string, success: number, failed: number, success_rate: number}`

### 6. Distribusi Aktivitas 24 Jam

**Component**: `HourlyActivityChart.tsx`

**Lokasi**: Kolom kanan baris ketiga (1/2 width)

**Fitur**:
- Area chart dengan gradient fill (blue to purple)
- X-axis: Jam (0-23)
- Y-axis: Jumlah aktivitas
- Smooth curve visualization
- Peak hours highlighting
- Grid background

**API Integration**:
- Endpoint: `GET /api/dashboard/charts/hourly`
- Query params: `start_date`, `end_date`, `cluster`
- Response: Array of `{hour: number, count: number}`

### 7. Pemantauan Kesalahan Logout

**Component**: `ErrorMonitoringTable.tsx`

**Lokasi**: Baris keempat (full width)

**Fitur**:
- Tabel komprehensif untuk error tracking
- Kolom:
  - ID Transaksi
  - Nama Pengguna
  - Satker
  - Waktu Kejadian
  - Status (Error badge)
  - Keterangan
- Pagination dengan page info
- Sortable columns (future enhancement)
- Export functionality (future)

**API Integration**:
- Endpoint: `GET /api/dashboard/activities`
- Filter: `aktifitas='LOGOUT' AND scope='error'`
- Query params: `page`, `page_size`, `start_date`, `end_date`, `cluster`

## Data Flow

```
User Action (Filter Change)
    ↓
Zustand Store Update (selectedCluster / dateRange)
    ↓
All Components Re-render
    ↓
useEffect Triggered in Each Component
    ↓
API Calls with New Filters
    ↓
Loading State → Data Received
    ↓
UI Updated
```

## API Endpoints yang Digunakan

1. **GET /api/dashboard/clusters**
   - Mendapatkan list cluster yang tersedia
   - Response: `{data: string[]}`

2. **GET /api/dashboard/stats**
   - Mendapatkan statistik utama
   - Query: `start_date`, `end_date`, `cluster`
   - Response: `{total_users, success_logins, total_activities, logout_errors, busiest_hour}`

3. **GET /api/dashboard/activities**
   - Mendapatkan log aktivitas
   - Query: `page`, `page_size`, `start_date`, `end_date`, `cluster`
   - Response: `{data: [], page, page_size, total, total_pages}`

4. **GET /api/dashboard/charts/hourly**
   - Mendapatkan distribusi per jam
   - Response: `{data: [{hour, count}]}`

5. **GET /api/dashboard/charts/cluster**
   - Mendapatkan distribusi per cluster
   - Response: `{data: [{scope, count}]}`

6. **GET /api/dashboard/access-success**
   - Mendapatkan success rate data
   - Response: `{data: [{date, success, failed, success_rate}]}`

## Styling

- **Framework**: Tailwind CSS
- **Theme**: BPK Corporate Style
  - Primary: Amber/Orange gradient (#F59E0B to #EA580C)
  - Secondary: Blue (#3B82F6)
  - Success: Green (#10B981)
  - Error: Red (#EF4444)
  - Warning: Amber (#F59E0B)
- **Typography**: Plus Jakarta Sans
- **Shadows**: Soft shadows untuk depth
- **Border Radius**: 12px untuk cards

## Responsive Design

- **Desktop (>1024px)**: 
  - Sidebar 320px expanded / 80px collapsed
  - Stats: 4 columns
  - Activity section: 3 columns
  - Charts section: 2 columns
  - Error table: full width

- **Tablet (768px - 1024px)**:
  - Sidebar auto-collapse
  - Stats: 2 columns
  - Activity section: 1-2 columns
  - Charts section: 1 column

- **Mobile (<768px)**:
  - Sidebar hidden dengan menu toggle
  - All sections: single column stack
  - Horizontal scroll untuk tabel

## State Management

### Local Component State

- `sidebarCollapsed`: Boolean untuk sidebar state
- Component-level loading/error states

### Global State (Zustand)

```typescript
interface AppStore {
  selectedCluster: string | null;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  setSelectedCluster: (cluster: string | null) => void;
  setDateRange: (range: { startDate: Date; endDate: Date }) => void;
  setPresetRange: (days: number) => void;
}
```

## Performance Optimizations

- React.memo untuk prevent unnecessary re-renders
- useMemo untuk expensive calculations
- useCallback untuk stable function references
- Debouncing untuk search inputs
- Lazy loading untuk charts
- Virtual scrolling untuk long tables (future)

## Improvements yang Direncanakan

1. **Real-time Updates**: WebSocket untuk live data
2. **Export Functionality**: Download data sebagai PDF/Excel
3. **Advanced Filtering**: Multi-select cluster, user search
4. **Comparison Mode**: Compare data antar periode
5. **Alerts & Notifications**: Threshold-based alerts
6. **Customizable Dashboard**: Drag & drop widgets
7. **Dark Mode**: Theme toggle
8. **Accessibility**: Full ARIA support dan keyboard navigation

## Navigasi

- URL: `/` (root/home)
- Menu: "Dashboard" di sidebar (dengan icon chart-bar)
- Active state: Highlighted dengan background gradient orange
- Filters: Terintegrasi dengan global state

## Dependencies

- React 19
- Next.js 15 (App Router)
- Tailwind CSS 3.4
- **Zustand** - Global state management
- **date-fns** - Date formatting dan manipulation
- **Recharts** - Chart visualizations (if used)
- Heroicons (inline SVG)

## File Structure

```
frontend/src/app/
├── page.tsx                              # Main dashboard page
├── components/
│   ├── dashboard/
│   │   ├── DashboardStats.tsx           # 4 stat cards
│   │   ├── BusiestHourCard.tsx          # Peak hour widget
│   │   └── DateRangePicker.tsx          # Date filter component
│   ├── charts/
│   │   ├── InteractionChart.tsx         # Cluster donut chart
│   │   ├── HourlyActivityChart.tsx      # 24h area chart
│   │   └── AccessSuccessChart.tsx       # Success rate line chart
│   ├── tables/
│   │   ├── ActivityTable.tsx            # Recent activities
│   │   └── ErrorMonitoringTable.tsx     # Logout errors
│   └── layout/
│       ├── Sidebar.tsx                  # Navigation sidebar
│       └── Header.tsx                   # Top header with filters
├── services/
│   └── api.ts                           # API service layer
├── stores/
│   └── appStore.ts                      # Zustand store
└── types/
    └── api.ts                           # TypeScript interfaces
```

## Testing

- [ ] Unit tests untuk components
- [ ] Integration tests untuk API calls
- [ ] E2E tests untuk user flows
- [ ] Visual regression tests
- [ ] Performance tests (Core Web Vitals)

## Accessibility (WCAG 2.1)

- Semantic HTML structure
- ARIA labels untuk interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
- Focus management

---

**Last Updated**: 2026-01-30
**Status**: Production Ready with API Integration
**Next Phase**: Real-time WebSocket Integration & Advanced Features

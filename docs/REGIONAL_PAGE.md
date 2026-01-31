# Halaman Analisis Organisasi & Regional

## Deskripsi

Halaman ini merupakan pusat analisis komprehensif untuk monitoring kinerja unit organisasi, distribusi geografis aktivitas pengguna, dan keterlibatan pengguna di seluruh wilayah Indonesia. Menyediakan insight mendalam tentang pola penggunaan berdasarkan lokasi dan unit kerja (satker).

## Layout & Navigation

### Sidebar

- **Status**: Terintegrasi dengan Sidebar global
- **Fitur**:
  - Logo MONIKA di bagian atas
  - Menu navigasi:
    - Dashboard (User Monitor)
    - **Analisis Regional & Unit** (Active)
    - Analisis Konten (Content Intelligence)
    - Laporan (Reports & Export)
  - Collapsible dengan animasi smooth (80px collapsed / 320px expanded)
  - Profile section di bagian bawah
  - Active state dengan gradient orange

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
  - Notification bell dengan badge counter
  - Settings icon
  - Admin User profile dengan dropdown menu

### Global State Management

- **Zustand Store** (`useAppStore`):
  - `selectedCluster`: Cluster yang aktif dipilih (string | null)
  - `dateRange`: { startDate: Date, endDate: Date } untuk filter tanggal
  - `setSelectedCluster`: Function untuk update cluster
  - `setDateRange`: Function untuk update date range
  - `setPresetRange`: Helper untuk set preset range (7/30/90 hari)
- Filter di Header otomatis tersinkronisasi dengan semua komponen
- Data reload otomatis saat filter berubah
- Persistent state menggunakan localStorage (optional)

## Fitur Utama

### 1. Peringkat Kinerja Unit Kerja

**Component**: `UnitPerformanceRanking` (atau bagian dari page)

**Lokasi**: Kolom kiri atas (1/2 width pada desktop)

**Fitur**:
- Ranking card dengan scrollable list
- Data unit kerja (satker) berdasarkan aktivitas tertinggi
- Informasi per unit:
  - Ranking badge (1, 2, 3, dst)
  - Nama unit kerja
  - Waktu puncak aktivitas (peak hour)
  - Jumlah total request
  - Progress bar visual untuk perbandingan
- Interactive selection (klik untuk lihat detail di chart)
- Highlight untuk unit terpilih
- Auto-scroll ke unit terpilih

**API Integration**:
- Endpoint: `GET /api/regional/units`
- Query params: `page`, `page_size`, `start_date`, `end_date`, `cluster`
- Response: `{data: [{rank, satker, count, peak_hour}], page, page_size, total_pages}`

**State Management**:
- `selectedUnit`: Unit yang sedang aktif dipilih
- Auto-refresh saat filter berubah
- Loading skeleton saat fetching data

### 2. Peta Distribusi Geografis Indonesia

**Component**: `IndonesiaMapView` (placeholder)

**Lokasi**: Kolom kanan atas (1/2 width pada desktop)

**Fungsi**: Visualisasi geografis interaktif distribusi aktivitas unit kerja di seluruh Indonesia

**Status**: Development - Placeholder untuk integrasi map library

**Planned Features**:
- Interactive SVG map Indonesia
- Province-level visualization
- Color intensity berdasarkan volume aktivitas
  - Hijau muda: Low activity
  - Hijau tua: Medium activity
  - Biru: High activity
  - Ungu: Very high activity
- Tooltip on hover dengan informasi:
  - Nama provinsi
  - Jumlah aktivitas
  - Top satker di provinsi tersebut
- Click untuk filter data berdasarkan provinsi
- Zoom & pan functionality
- Legend dengan color scale

**Technology Options**:
- react-simple-maps (recommended - ringan & customizable)
- Leaflet + GeoJSON Indonesia
- D3.js custom visualization
- Mapbox GL (jika butuh advanced features)

**API Integration** (Planned):
- Endpoint: `GET /api/regional/map`
- Query params: `start_date`, `end_date`, `cluster`
- Response: `{data: [{province, count, top_satker, coordinates}]}`

### 3. Jam Operasional Unit Kerja

**Component**: `UnitOperationalHours`

**Lokasi**: Baris kedua (full width)

**Fitur**:
- Unit selector tabs/dropdown
  - Klik untuk switch antar unit kerja
  - Sticky header saat scroll
- Bar chart horizontal 24 jam (0:00 - 23:00)
- Visual elements:
  - Gradient bars (blue to purple)
  - Y-axis: Jam (0h - 23h)
  - X-axis: Jumlah aktivitas (dynamic scale)
  - Grid lines untuk readability
  - Peak hour marking (highlight berbeda)
- Interactive hover:
  - Tooltip dengan detail aktivitas
  - Highlight bar on hover
- Selected unit highlighting dengan accent color
- Smooth animation saat switch unit

**API Integration**:
- Endpoint: `GET /api/regional/units/hourly`
- Query params: `satker`, `start_date`, `end_date`, `cluster`
- Response: `{data: [{hour: number, count: number}]}`

**Performance**:
- Data caching untuk unit yang sudah di-load
- Debounced API calls saat rapid switching
- Skeleton loading untuk better UX

### 4. Distribusi Geografis - List View

**Component**: `GeographicDistributionList`

**Lokasi**: Kolom kiri bawah (1/2 width)

**Fitur**:
- Hierarchical breakdown aktivitas per wilayah
- 5 Region utama Indonesia:
  1. **JAWA, BALI & NUSA TENGGARA**
     - Highest activity zone
     - Provinsi: DKI Jakarta, Jawa Barat, Jawa Tengah, Jawa Timur, Bali, NTB, NTT
  2. **SUMATERA**
     - Provinsi: Aceh, Sumut, Sumbar, Riau, Jambi, Sumsel, Bengkulu, Lampung
  3. **SULAWESI**
     - Provinsi: Sulut, Sulteng, Sulsel, Sultra, Gorontalo, Sulbar
  4. **KALIMANTAN**
     - Provinsi: Kalbar, Kalteng, Kalsel, Kaltim, Kaltara
  5. **MALUKU & PAPUA**
     - Provinsi: Maluku, Malut, Papua, Papua Barat
- UI Elements:
  - Expandable/collapsible sections per region
  - Total count per region (bold)
  - Province list dengan detail count
  - Status indicators (blue dots untuk top provinces)
  - Total akumulasi di bottom
  - Scrollable container dengan max-height
  - Grid layout 2 kolom untuk better space usage

**API Integration**:
- Endpoint: `GET /api/regional/locations`
- Query params: `start_date`, `end_date`, `cluster`
- Response: `{data: [{lokasi: string, count: number}]}`
- Post-processing: Group by region di frontend

### 5. Distribusi Geografis - Donut Chart

**Component**: `GeographicDistributionChart`

**Lokasi**: Kolom kanan bawah (1/2 width)

**Fitur**:
- SVG-based donut chart visualization
- 5 Segments merepresentasikan region:
  - **Jawa, Bali & Nusa Tenggara**: Biru (#3B82F6)
  - **Sumatera**: Amber (#F59E0B)
  - **Sulawesi**: Purple (#8B5CF6)
  - **Kalimantan**: Green (#10B981)
  - **Maluku & Papua**: Red (#EF4444)
- Visual elements:
  - Center label dengan total count
  - Legend di bawah chart:
    - Warna indicator
    - Nama region
    - Count absolut
    - Percentage (%)
  - Percentage labels outside segments
- Interactive:
  - Hover untuk highlight segment
  - Click untuk filter data berdasarkan region
  - Smooth animation on load
  - Tooltip dengan detail breakdown

**Calculation**:
- Dynamic percentage berdasarkan total
- Sort by count (descending)
- Color assignment consistent dengan theme

**API Integration**:
- Menggunakan data yang sama dengan List View
- Endpoint: `GET /api/regional/locations`
- Data transformation di frontend untuk chart format

### 6. Kontributor Aktivitas Teratas

**Component**: `TopContributorsTable`

**Lokasi**: Baris terakhir (full width)

**Fitur**:
- Top 10 pengguna paling aktif di regional yang dipilih
- Tabel dengan kolom:
  - **Rank**: Badge 1-10 dengan gradient coloring
    - Top 3: Gold/Silver/Bronze gradient
    - 4-10: Standard blue gradient
  - **Nama Pengguna**: Masked untuk privacy (e.g., "A*** D***")
  - **Unit Kerja**: Full nama satker
  - **Total Request**: Jumlah aktivitas
  - **Region**: Wilayah asal
- Visual enhancements:
  - Alternating row colors
  - Hover effects untuk row highlighting
  - Top 3 dengan accent background
  - Progress bar mini untuk visual comparison
- No pagination (fixed top 10)
- Export button untuk download list

**API Integration**:
- Endpoint: `GET /api/regional/top-contributors`
- Query params: `start_date`, `end_date`, `cluster`, `region` (optional)
- Response: `{data: [{rank, nama, satker, count, region, masked_name}]}`

**Privacy**:
- Username masking di backend atau frontend
- Format: First letter + *** + Last letter(s)

## Data Flow

```
User Action (Filter/Select Unit)
    ↓
Zustand Store Update (cluster/dateRange) or Local State (selectedUnit)
    ↓
Affected Components Re-render
    ↓
useEffect Triggered
    ↓
API Call with Updated Params
    ↓
Loading State → Data Received
    ↓
Transform Data (if needed)
    ↓
Update UI with New Data
```

## API Endpoints yang Digunakan

1. **GET /api/dashboard/clusters**
   - Mendapatkan list cluster available
   - Response: `{data: string[]}`

2. **GET /api/regional/provinces**
   - Mendapatkan statistik per provinsi
   - Response: `{data: [{province: string, count: number}]}`

3. **GET /api/regional/locations**
   - Mendapatkan statistik per lokasi (untuk grouping ke region)
   - Query: `start_date`, `end_date`, `cluster`
   - Response: `{data: [{lokasi: string, count: number}]}`

4. **GET /api/regional/units**
   - Mendapatkan ranking unit kerja
   - Query: `page`, `page_size`, `start_date`, `end_date`, `cluster`
   - Response: `{data: [{rank, satker, count}], page, page_size, total_pages}`

5. **GET /api/regional/units/hourly**
   - Mendapatkan distribusi jam operasional per unit
   - Query: `satker`, `start_date`, `end_date`, `cluster`
   - Response: `{data: [{hour: number, count: number}]}`

6. **GET /api/regional/top-contributors** (Planned)
   - Mendapatkan top contributors
   - Response: `{data: [{rank, nama, satker, count}]}`

## State Management

### Local Component State

```typescript
const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
```

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

## Styling

- **Framework**: Tailwind CSS 3.4
- **Theme**: BPK Corporate Style
  - Primary: Amber/Orange gradient (#F59E0B to #EA580C)
  - Accent: Blue (#3B82F6), Purple (#8B5CF6), Green (#10B981)
  - Neutral: Gray scale
- **Typography**: Plus Jakarta Sans
- **Shadows**: Soft shadows untuk card depth
- **Border Radius**: 12px untuk consistency
- **Transitions**: 300ms ease untuk smooth UX
- **Custom Utilities**: Hidden scrollbar, gradient backgrounds

## Responsive Design

- **Desktop (>1280px)**: 
  - Sidebar 320px expanded / 80px collapsed
  - Performance & Map: 2 columns (50-50)
  - Hourly chart: full width
  - Distribution: 2 columns (50-50)
  - Contributors: full width

- **Tablet (768px - 1280px)**:
  - Sidebar auto-collapse
  - Performance & Map: stacked
  - Charts: full width
  - Distribution: stacked

- **Mobile (<768px)**:
  - Sidebar hidden dengan hamburger menu
  - All sections: single column stack
  - Horizontal scroll untuk wide charts
  - Simplified chart views
  - Touch-optimized interactions

## Performance Optimizations

- **React.memo** untuk prevent unnecessary re-renders
- **useMemo** untuk expensive calculations (chart data transformation)
- **useCallback** untuk stable function references
- **Lazy loading** untuk map component (React.lazy + Suspense)
- **Data caching** dengan React Query atau SWR (future)
- **Debouncing** untuk filter inputs
- **Virtual scrolling** untuk long unit lists
- **Code splitting** untuk regional page bundle

## Improvements yang Direncanakan

1. **Peta Interaktif Indonesia**
   - Integrasi library: react-simple-maps
   - GeoJSON Indonesia boundary data
   - Interactive province selection
   - Drill-down ke kabupaten/kota level

2. **Real-time Updates**
   - WebSocket connection untuk live data
   - Auto-refresh indicator
   - Notification untuk significant changes

3. **Advanced Filtering**
   - Multi-select provinces
   - Unit type filtering (pusat vs daerah)
   - Activity type filtering

4. **Comparison Mode**
   - Compare 2 periods side-by-side
   - Year-over-year comparison
   - Region vs region comparison

5. **Export Functionality**
   - Download charts as PNG/SVG
   - Export data as Excel/CSV
   - Generate PDF report

6. **Enhanced Analytics**
   - Trend analysis (growing/declining regions)
   - Anomaly detection
   - Predictive analytics untuk capacity planning

7. **Accessibility Improvements**
   - Full ARIA labels
   - Keyboard navigation
   - Screen reader optimization
   - High contrast mode

## Navigasi

- **URL**: `/regional`
- **Menu**: "Analisis Regional & Unit" di sidebar
- **Icon**: Users icon (Heroicons)
- **Active state**: Gradient orange background
- **Breadcrumb**: Dashboard > Analisis Regional & Unit
- **Filters**: Shared dengan global state (date range, cluster)

## Dependencies

- **React** 19.x
- **Next.js** 15.x (App Router)
- **Tailwind CSS** 3.4.x
- **Zustand** - Global state management
- **date-fns** - Date formatting dan manipulation
- **Heroicons** - Icon library (inline SVG)
- **react-simple-maps** (Planned) - Map visualization
- **Recharts** (Optional) - Chart library alternative

## File Structure

```
frontend/src/app/regional/
├── page.tsx                           # Main regional page component
└── components/                        # (Future) Regional-specific components
    ├── UnitPerformanceRanking.tsx
    ├── IndonesiaMapView.tsx
    ├── UnitOperationalHours.tsx
    ├── GeographicDistributionList.tsx
    ├── GeographicDistributionChart.tsx
    └── TopContributorsTable.tsx

frontend/src/components/
├── layout/
│   ├── Sidebar.tsx                    # Shared sidebar
│   └── Header.tsx                     # Shared header
├── charts/                            # Shared chart components
└── tables/                            # Shared table components

frontend/src/services/
└── api.ts                             # API service layer
    └── regionalService                # Regional-specific API calls

frontend/src/stores/
└── appStore.ts                        # Zustand global store

frontend/src/types/
└── api.ts                             # TypeScript interfaces
```

## Testing

### Unit Tests
- [ ] Component rendering tests
- [ ] State management tests (Zustand)
- [ ] Data transformation functions
- [ ] API service mocking

### Integration Tests
- [ ] API integration with mock server
- [ ] Filter synchronization
- [ ] Navigation flow
- [ ] Data fetching error handling

### E2E Tests (Playwright/Cypress)
- [ ] Complete user journey
- [ ] Filter interactions
- [ ] Chart interactions
- [ ] Export functionality
- [ ] Responsive behavior

### Performance Tests
- [ ] Lighthouse score (>90)
- [ ] Core Web Vitals
- [ ] Bundle size optimization
- [ ] Load time monitoring

## Accessibility (WCAG 2.1 AA)

- **Semantic HTML**: Proper heading hierarchy (h1-h6)
- **ARIA Labels**: Descriptive labels untuk interactive elements
- **Keyboard Navigation**: 
  - Tab order yang logical
  - Enter/Space untuk activation
  - Escape untuk close modals
- **Color Contrast**: Minimum 4.5:1 untuk text
- **Screen Reader**: Announcements untuk dynamic updates
- **Focus Management**: Visible focus indicators
- **Alternative Text**: Deskripsi untuk visual charts

---

**Last Updated**: 2026-01-30
**Status**: Production Ready - Awaiting Map Integration
**Next Phase**: Interactive Map Implementation & Real-time WebSocket Integration

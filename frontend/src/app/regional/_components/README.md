# Regional Page Components

This folder contains components that are **specific to the Regional Analysis page only**.

## Components

### UnitPerformanceRanking.tsx
- Displays top 10 or bottom 10 satker (unit kerja) by activity count
- Toggle button to switch between top and bottom performers
- Scrollable list with ranking badges and progress bars
- Shows request count for each unit

**Props**:
- `performanceData`: SatkerPerformance[] - Array of unit performance data

### IndonesiaMapSection.tsx
- Interactive Indonesia map showing geographic distribution
- Province-level activity visualization
- Dynamic import (client-side only) for better performance
- Uses `@/components/maps/IndonesiaMap` component

**Props**:
- `mapData`: { name: string; count: number }[] - Province activity data

### UnitOperationalHours.tsx
- 24-hour activity chart for selected unit
- Smooth SVG area chart with gradient fill
- Unit selector list (top 10 units)
- Peak hour display with real-time calculation
- Loading state during data fetch

**Props**:
- `performanceData`: SatkerPerformance[] - List of units for selector
- `selectedUnit`: string - Currently selected unit
- `setSelectedUnit`: (unit: string) => void - Function to change selected unit
- `displayHourlyData`: HourlyData[] - 24-hour activity data
- `loadingHourly`: boolean - Loading state
- `getPeakTime`: () => string - Function to calculate peak hour

### GeographicDistributionList.tsx
- Hierarchical breakdown of activity by region and province
- 2-column grid layout for better space usage
- Highlighting for high-activity provinces (>50 requests)
- Total access count display
- Scrollable container with max-height

**Props**:
- `geoData`: { [key: string]: GeoRegion } - Geographic data grouped by region

### GeographicDistributionChart.tsx
- SVG donut chart for geographic distribution
- Color-coded regions with percentage labels
- Interactive segments with hover effects
- Legend with count and percentage
- Center label showing total count

**Props**:
- `geoData`: { [key: string]: GeoRegion } - Same data as list view

### TopContributors.tsx
- Displays top 10 users by activity count
- Ranking badges (1-10) with amber gradient
- Shows username, satker/unit, and request count
- Modern smooth scrolling with custom scrollbar
- Hover effects for interactivity
- Empty state when no data

**Props**:
- `topContributors`: TopContributor[] - Array of top contributors

## Data Flow

```
RegionalPage (Main)
    ↓ Fetch API Data
    ├─→ UnitPerformanceRanking (performanceData)
    ├─→ IndonesiaMapSection (mapData)
    ├─→ UnitOperationalHours (performanceData, selectedUnit, hourlyData)
    ├─→ GeographicDistributionList (geoData)
    ├─→ GeographicDistributionChart (geoData)
    └─→ TopContributors (topContributors)
```

## Interfaces

### SatkerPerformance
```typescript
interface SatkerPerformance {
  satker: string;      // Unit name
  requests: number;    // Total requests
  peakTime: string;    // Peak hour (HH:MM)
  rank: number;        // Ranking position
}
```

### GeoRegion
```typescript
interface GeoRegion {
  total: number;
  provinces: {
    name: string;
    count: number;
    highlighted: boolean;  // true if count > 50
  }[];
}
```

### HourlyData
```typescript
interface HourlyData {
  hour: number;   // 0-23
  count: number;  // Activity count
}
```

### TopContributor
```typescript
interface TopContributor {
  rank: number;       // 1-10 ranking
  username: string;   // User name
  unit: string;       // Satker/Unit name
  requests: number;   // Total activity count
}
```

## Import Pattern

All these components use the **co-location pattern**:

```tsx
// ✅ Correct
import UnitPerformanceRanking from "./_components/UnitPerformanceRanking";
import IndonesiaMapSection from "./_components/IndonesiaMapSection";
import TopContributors from "./_components/TopContributors";

// ❌ Wrong (old path)
import UnitPerformanceRanking from "@/components/regional/UnitPerformanceRanking";
```

## Design Decisions

### Why Separate Components?

1. **Maintainability**: Each component is ~100-300 lines instead of 1150+ in one file
2. **Debugging**: Easy to isolate issues to specific components
3. **Reusability**: Components can be reused if needed
4. **Testing**: Easier to write unit tests for individual components
5. **Performance**: Can optimize re-renders per component

### Why Co-location?

- **Proximity**: Component code is close to where it's used
- **Clear Ownership**: It's obvious these components belong to Regional page
- **No Confusion**: Won't accidentally use these in other pages
- **Better DX**: Easier to navigate in file explorer

## State Management

### Local State (in RegionalPage main file)
- `performanceData`: Fetched satker performance data
- `geoData`: Geographic distribution data grouped by region
- `mapData`: Province-level data for map visualization
- `hourlyData`: Global 24-hour activity data
- `unitHourlyData`: Unit-specific 24-hour data
- `selectedUnit`: Currently selected unit for hourly chart
- `topContributors`: Top 10 users by activity count
- `loading`: Main data loading state
- `loadingHourly`: Hourly data loading state

### Shared State (Zustand)
- `selectedCluster`: Active cluster filter
- `dateRange`: Start and end date for filtering
- `sidebarCollapsed`: Sidebar collapse state

## API Integration

Components receive already-fetched data from the main page:

1. **Regional API** (`regionalService`):
   - `getUnits()` → performanceData
   - `getLocations()` → geoData, mapData
   - `getUnitHourlyData()` → unitHourlyData
   - `getTopContributors()` → topContributors

2. **Dashboard API** (`dashboardService`):
   - `getHourlyChart()` → hourlyData (global)

## Performance Optimizations

- **Dynamic Import**: Map component loaded only on client-side
- **Memoization**: Large SVG calculations done once
- **Debouncing**: API calls debounced on rapid filter changes
- **Virtual Scrolling**: Could be implemented for long unit lists
- **Custom Scrollbar**: Smooth scrolling for top contributors list

## Future Improvements

1. **Add Loading Skeletons**: Better UX during data fetch
2. **Add Error States**: Show user-friendly error messages
3. **Add Empty States**: Better UI when no data available
4. **Add Interactive Features**: Click on chart to filter, etc.
5. **Add Pagination**: For top contributors if needed (100+)

---

**Last Updated**: 2026-01-30
**Total Components**: 6
**Lines Saved**: ~700 lines (from 1153 to ~460 in main page)


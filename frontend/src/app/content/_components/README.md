# Content Analytics Components

## Architecture Overview

This folder follows **Clean Architecture** and **MVC (Model-View-Controller)** patterns:

```
content/
├── page.tsx              # Controller/Layout (orchestrates widgets)
└── _components/          # View Components (self-contained widgets)
    ├── index.ts          # Barrel export
    ├── DashboardRankings.tsx    # Feature 1: Rankings (dateRange filter only)
    ├── SearchModuleUsage.tsx    # Feature 2: Search module (dateRange + cluster filter)
    ├── ExportMonitoring.tsx     # Feature 2: Export stats (dateRange + cluster filter)
    ├── OperationalIntents.tsx   # Feature 2: Access keywords (dateRange + cluster filter)
    └── GlobalEconomicsChart.tsx # Feature 3: Economics chart
```

## Feature Structure

### Feature 1: Peringkat Penggunaan Dashboard
**Component**: `DashboardRankings.tsx`
- Shows all clusters ranked by usage count
- Gradient coloring system (TOP 5 green, MIDDLE yellow, BOTTOM 5 red)
- **Filter**: Date range only (from global state)
- **Does NOT use cluster filter** - always shows all clusters

### Feature 2: Cluster-Based Analysis Widgets
**Components**: `SearchModuleUsage.tsx`, `ExportMonitoring.tsx`, `OperationalIntents.tsx`

**Global Filters Used** (from Header - by Rayhan):
- **Date Range Filter** - from `appStore.dateRange`
- **Cluster Filter** - from `appStore.selectedCluster`

**Widget Details**:
1. **SearchModuleUsage**: Vertical bar chart showing search activities
2. **ExportMonitoring**: View / Download / Export stats in 3 columns
3. **OperationalIntents**: Feature access keywords as colored tags

**Key Characteristics**:
- All 3 widgets use **global filters** from `useAppStore()`
- Empty string (`""`) in selectedCluster = show all clusters
- Filters managed by Header component (integrated with Dashboard & Regional pages)
- Description texts must remain unchanged (user requirement)

### Feature 3: Global Economics Chart
**Component**: `GlobalEconomicsChart.tsx`
- Independent widget
- Shows economics module usage

## Design Principles

### 1. Single Responsibility Principle (SRP)
Each widget component is responsible for:
- Fetching its own data
- Managing its own loading state
- Handling its own errors
- Rendering its own UI

### 2. Separation of Concerns
- **page.tsx**: Layout orchestration + cluster state management
- **_components/*.tsx**: Self-contained widgets with data fetching
- **services/api.ts**: API communication layer
- **stores/appStore.ts**: Global state (date range, user, etc.)

### 3. Component Structure
Each widget follows this pattern:

```tsx
export default function WidgetName({ selectedCluster }: Props) {
  // State
  const [data, setData] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global state (if needed)
  const { dateRange } = useAppStore();

  // Data fetching (reacts to dateRange AND selectedCluster)
  useEffect(() => {
    loadData();
  }, [dateRange, selectedCluster]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await service.getData();
      setData(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) return <LoadingSkeleton />;

  // Error state
  if (error) return <ErrorMessage error={error} />;

  // Main render
  return <WidgetUI data={data} />;
}
```

## Components

### DashboardRankings
Displays ranked list of most visited dashboard clusters with:
- Colored rank badges
- Progress bars showing relative usage
- Count values

### SearchModuleUsage
Shows search module usage statistics:
- Module names
- Usage counts
- Simple list view

### GlobalEconomicsChart
Bar chart visualization for global economics data:
- Y-axis labels
- Colored bars
- Category labels

### ExportMonitoring
Three-card display for export statistics:
- Data Manifest count
- Back Jst count
- Total Downloads

### OperationalIntents
Tag cloud of operational intents:
- Colored tags
- Count badges
- Configurable limit prop

## Usage

```tsx
import {
  DashboardRankings,
  SearchModuleUsage,
  GlobalEconomicsChart,
  ExportMonitoring,
  OperationalIntents,
} from "./_components";

// In page.tsx
<DashboardRankings />
<SearchModuleUsage />
<GlobalEconomicsChart />
<ExportMonitoring />
<OperationalIntents limit={10} />
```

## Props

### OperationalIntents
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| limit | number | 10 | Maximum number of intents to display |

## Related Files

- **Services**: `frontend/src/services/api.ts` - `contentService`
- **Store**: `frontend/src/stores/appStore.ts` - Global state
- **Types**: `frontend/src/types/api.ts` - TypeScript interfaces

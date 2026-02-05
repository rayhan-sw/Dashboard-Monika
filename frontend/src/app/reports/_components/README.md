# Reports Page Components

## Architecture Overview

This folder follows **Clean Architecture** and **MVC (Model-View-Controller)** patterns:

```
reports/
├── page.tsx              # Controller/Layout (orchestrates widgets)
└── _components/          # View Components (self-contained widgets)
    ├── index.ts          # Barrel export
    ├── ReportHeaderBanner.tsx
    ├── ReportTemplateCards.tsx
    ├── DownloadHistoryList.tsx
    └── AccessRequestList.tsx
```

## Design Principles

### 1. Single Responsibility Principle (SRP)
Each widget component handles:
- Its own data fetching
- Loading/error states
- User interactions
- UI rendering

### 2. Separation of Concerns
- **page.tsx**: Layout orchestration and role-based rendering
- **_components/*.tsx**: Self-contained widgets
- **services/api.ts**: API communication layer
- **stores/appStore.ts**: User authentication state

### 3. Inter-Component Communication
Uses `forwardRef` and `useImperativeHandle` for parent-child communication:

```tsx
// Child (DownloadHistoryList.tsx)
export interface DownloadHistoryRef {
  refresh: () => void;
}

const DownloadHistoryList = forwardRef<DownloadHistoryRef, Props>((props, ref) => {
  useImperativeHandle(ref, () => ({
    refresh: loadDownloads,
  }));
  // ...
});

// Parent (page.tsx)
const downloadHistoryRef = useRef<DownloadHistoryRef>(null);
<ReportTemplateCards onReportGenerated={() => downloadHistoryRef.current?.refresh()} />
<DownloadHistoryList ref={downloadHistoryRef} />
```

## Components

### ReportHeaderBanner
Static BPK header banner with:
- BPK logo (with fallback)
- Title and subtitle
- Gradient background

**Props:**
| Prop | Type | Default |
|------|------|---------|
| title | string | "Badan Pemeriksa Keuangan Republik Indonesia" |
| subtitle | string | "Laporan dengan Kop Surat Resmi BPK RI" |

### ReportTemplateCards
Three report template cards with:
- Template icon
- Title and description
- Format buttons (CSV, Excel, PDF)
- Report generation functionality

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| onReportGenerated | () => void | Callback when report is generated |

### DownloadHistoryList
List of recently downloaded reports:
- Format icons
- Report names
- Generation dates
- Download buttons

**Props & Ref:**
| Prop | Type | Default |
|------|------|---------|
| limit | number | 5 |

| Ref Method | Description |
|------------|-------------|
| refresh() | Reload download history |

### AccessRequestList
Admin-only component for managing access requests:
- User avatars
- Request details
- Approve/Reject buttons
- Status badges

## Role-Based Rendering

The page uses `useAppStore` for role-based conditional rendering:

```tsx
const user = useAppStore((state) => state.user);
const userRole = user?.role || "admin";

// In JSX
{userRole === "admin" && <AccessRequestList />}
```

## Usage

```tsx
import {
  ReportHeaderBanner,
  ReportTemplateCards,
  DownloadHistoryList,
  AccessRequestList,
  type DownloadHistoryRef,
} from "./_components";

// In page.tsx
const downloadHistoryRef = useRef<DownloadHistoryRef>(null);

<ReportHeaderBanner />
<ReportTemplateCards onReportGenerated={() => downloadHistoryRef.current?.refresh()} />
<DownloadHistoryList ref={downloadHistoryRef} limit={5} />
{userRole === "admin" && <AccessRequestList />}
```

## Related Files

- **Services**: `frontend/src/services/api.ts` - `reportService`
- **Store**: `frontend/src/stores/appStore.ts` - User state
- **Types**: `frontend/src/types/api.ts` - TypeScript interfaces

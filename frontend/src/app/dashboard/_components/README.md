# Dashboard Page Components

This folder contains components that are **specific to the Dashboard page only**.

## Components

### DashboardStats.tsx
- 4 stat cards showing: Total Users, Success Logins, Total Activities, Logout Errors
- Fetches data from `/api/dashboard/stats`
- Auto-refreshes when filters change

### BusiestHourCard.tsx
- Displays the busiest hour of the day
- Shows peak traffic time and activity count
- Uses data from dashboard stats API

### ActivityTable.tsx
- Recent activity log table
- Shows user activities with pagination
- Displays: Name, Satker, Activity, Timestamp

### ErrorMonitoringTable.tsx
- Full-width table for logout error tracking
- Monitors and displays logout failures
- Includes pagination and filtering

## Import Pattern

All these components use the **co-location pattern**:

```tsx
// Correct
import DashboardStats from "./_components/DashboardStats";

// Wrong (old path)
import DashboardStats from "@/components/dashboard/DashboardStats";
```

## Why `_components`?

The underscore prefix (`_`) in Next.js 15 App Router indicates a **private folder** that won't become a route. This allows us to keep page-specific components close to where they're used, following the principle of co-location.

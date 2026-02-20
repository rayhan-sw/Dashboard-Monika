# MoSearch Enhancement - BPKTreeView Component

## Overview

The BPKTreeView component provides a hierarchical, multi-select tree view for selecting organizational units (Satuan Kerja) based on the `ref_satker_units` table structure.

## Features

### ✨ Key Capabilities

1. **Hierarchical Display**: Shows organizational structure with parent-child relationships
2. **Multi-Select**: Select multiple units at once with checkboxes
3. **Cascade Selection**: Selecting a parent automatically selects all children
4. **Search Functionality**: Real-time search with auto-expand results
5. **Eselon Filtering**: Filter by eselon level (E1, E2, E3, E4)
6. **Activity Count**: Optional display of activity counts per unit
7. **Expand/Collapse Controls**: Bulk expand/collapse all nodes
8. **Selection Management**: Clear all or select all functionality

## Component API

### Props

```typescript
interface BPKTreeViewProps {
  // Array of selected satker unit IDs
  selectedIds: number[];
  
  // Callback when selection changes
  onSelectionChange: (ids: number[]) => void;
  
  // Optional eselon level filter (e.g., "E1", "E2")
  eselonFilter?: string;
  
  // Show activity count for each unit
  showActivityCount?: boolean;
  
  // Maximum height of the tree view
  maxHeight?: string; // default: "400px"
}
```

### Usage Example

```tsx
import BPKTreeView from "./_components/BPKTreeView";

function MyComponent() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  return (
    <BPKTreeView
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      eselonFilter="E2"
      showActivityCount={true}
      maxHeight="500px"
    />
  );
}
```

## Integration with Search Page

### SearchFiltersState Updates

The `SearchFiltersState` interface now includes:

```typescript
interface SearchFiltersState {
  // ... other fields
  satker: string;        // Legacy: single satker name
  satkerIds: number[];   // New: multiple satker IDs from tree view
}
```

### Backend API Support

#### Endpoint used by this component: `GET /api/metadata/satker`

**Response:**
```json
{
  "satker": [
    {
      "id": 1,
      "satker_name": "Sekretariat Jenderal",
      "eselon_level": "Eselon I",
      "parent_id": null
    }
  ]
}
```

**Alternative:** `GET /api/org-tree` returns a nested tree with optional activity counts (query params: `eselon_level`, `include_activity_count`, `start_date`, `end_date`). BPKTreeView currently uses `/api/metadata/satker` and builds the tree on the client.

#### Search Endpoint Updates: `/api/search`

New query parameter:
- `satkerIds`: Comma-separated list of satker IDs (e.g., "1,2,3,4")

Example:
```
GET /api/search?satkerIds=1,5,10&dateRange=30days&status=SUCCESS
```

## UI/UX Features

### Visual Indicators

- **Folder Icons**: Different icons for parent nodes (with children) and leaf nodes
- **Eselon Badges**: Color-coded badges (E1: purple, E2: blue, E3: green, E4: gray)
- **Indeterminate Checkboxes**: Shows partial selection state for parent nodes
- **Highlight Selection**: Selected items highlighted in orange

### User Actions

1. **Search**: Type in search box to filter nodes (auto-expands matches)
2. **Expand/Collapse**: Click arrow icon or use bulk controls
3. **Select**: Click checkbox to select node and all descendants
4. **Clear**: Remove all selections with one click
5. **Select All**: Select all visible nodes

## Performance Considerations

- Tree data is fetched once on mount
- Search filtering is client-side for instant results
- Lazy rendering with virtualization for large trees (consider adding if needed)
- Debounced search input (can be added if performance issues arise)

## Styling

The component uses Tailwind CSS with custom BPK theme colors:
- Primary: `bpk-orange` (#E67E22 or configured theme color)
- Borders: `border-bpk-orange`
- Backgrounds: `bg-orange-50`
- Rounded corners: `rounded-lg-bpk`

## Accessibility

- ✅ Keyboard navigation support (native checkbox behavior)
- ✅ Semantic HTML structure
- ✅ ARIA labels (checkboxes)
- ✅ Focus indicators
- ⚠️ Screen reader announcements (consider enhancement)

## Future Enhancements

1. **Virtualization**: For very large trees (1000+ nodes)
2. **Drag & Drop**: Reorder or move nodes
3. **Context Menu**: Right-click options for nodes
4. **Export Selection**: Export selected IDs as CSV/JSON
5. **Preset Selections**: Save and load common selections
6. **Async Loading**: Load children on-demand for huge trees

## Files Modified

### Frontend
- ✅ `BPKTreeView.tsx` - New tree view component
- ✅ `SearchFilters.tsx` - Integrated tree view
- ✅ `page.tsx` - Updated filter state handling
- ✅ `index.ts` - Export new component

### Backend
- ✅ `search_handler.go` - Parse satkerIds parameter
- ✅ `search_repository.go` - Filter by satker IDs
- ✅ `org_tree_handler.go` - Tree data API (already existed)

## Testing Checklist

- [ ] Tree loads correctly with hierarchical data
- [ ] Search filters nodes properly
- [ ] Multi-select works (parent → children cascade)
- [ ] Eselon filter applies correctly
- [ ] Backend returns correct filtered results
- [ ] Selection persists when toggling tree view
- [ ] Clear/Select All buttons work
- [ ] Mobile responsive layout
- [ ] No console errors
- [ ] Performance with 100+ nodes

## Troubleshooting

### Tree not loading
- Check backend API is running on `http://localhost:8080`
- Verify `GET /api/metadata/satker` returns `{"satker": [...]}`
- Check browser console for CORS errors

### Selection not working
- Verify `onSelectionChange` callback is properly bound
- Check that `selectedIds` prop is updated in parent state
- Ensure IDs are numbers, not strings

### Search not filtering
- Check `filterTree` function is being called
- Verify search query is lowercase (case-insensitive)
- Ensure tree state is updated after search

## Support

For issues or questions, check:
1. Browser DevTools console for errors
2. Network tab for API call failures
3. Component props are correctly passed
4. Backend logs for API errors

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-19  
**Author**: MoSearch Enhancement Team

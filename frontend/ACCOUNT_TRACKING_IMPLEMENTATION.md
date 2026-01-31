# Account Tracking Feature - Implementation Guide

## Overview
The Account Tracking feature provides admins with a detailed audit history of user actions, including fraud detections, account blocks/unblocks, and system updates. The feature dynamically maps flexible backend tracking data to user-friendly UI cards.

---

## Files Created & Modified

### 1. **src/api/types.ts** - Added Type Definition
```typescript
export interface UserTrackingResponse {
  id: number;
  actionType: string; // e.g., "FRAUD_DETECTED", "USER_BLOCKED"
  details: Record<string, any>; // Flexible map from backend
  createdAt: string; // ISO 8601 UTC string
}
```

### 2. **src/api/adminApi.ts** - Added API Method
```typescript
getTrackingUser: async (
  userId: number,
  page: number = 1,
  size: number = 20
): Promise<PageResponse<UserTrackingResponse>>
```
- **Endpoint**: `GET /users/{userId}/tracking?page={page}&size={size}`
- **Pagination**: Direct page passing (Backend handles -1 conversion)
- **QueryKey**: `["user-tracking", userId, page]` for caching

### 3. **src/components/admin/AccountTrackingDrawer.tsx** - New Component
Complete component with:
- Dynamic tracking item rendering based on backend data
- Timeline visualization with icons and colors
- Pagination support
- Loading and empty states
- Smart mapping logic for different action types

### 4. **src/pages/admin/AdminUserPage.tsx** - Integration
- Added tracking page state management
- Updated dropdown menu with "View Account Tracking" option
- Integrated AccountTrackingDrawer component
- Added selectedUser state to pass user info to drawer

---

## Dynamic Mapping Logic

### Fraud Alert Detection
When details contains `fraudType` OR `bidId`:
```
Details:
  - fraudType: "MULTIPLE_ACCOUNTS" | "SUSPICIOUS_PATTERN" | etc.
  - bidId: number
  - auctionId: number (optional)
  - description: string (optional)

Display:
  ✓ Red card with 🚨 FRAUD ALERT badge
  ✓ Fraud Type tag (highlighted in red)
  ✓ Bid ID and Auction ID as tags
  ✓ Description in message box
```

### Admin Action Detection
When details contains `reason` OR `by`:
```
Details:
  - reason: string (why action was taken)
  - by: string (admin email/name who took action)
  + Other custom fields

Display:
  ✓ Colored card matching action type
  ✓ "By: {admin}" shown in header
  ✓ Reason in highlighted box
  ✓ Additional fields as tags
```

### Fallback - Generic Key-Value
For any other tracking type:
```
Display:
  ✓ Card with action type tag
  ✓ All detail fields as hoverable tags
  ✓ Truncated values (max 20-30 chars)
```

---

## Visual Design

### Color Coding by Action Type
| Action Type | Icon | Color | Meaning |
|-------------|------|-------|---------|
| FRAUD | 🚨 AlertOutlined | red | Fraud detected |
| BLOCK | 🔒 LockOutlined | volcano | User blocked |
| UNBLOCK | 🔓 UnlockOutlined | green | User unblocked |
| Other | ✓ CheckCircleOutlined | blue | System action |

### Timeline Layout
- Each tracking entry is a Timeline.Item
- Icon colored according to action type
- Timestamp formatted as "DD/MM/YYYY HH:mm:ss" (local time via dayjs)
- Card content varies by mapping logic

---

## Pagination Details

### When Displayed
- Shows only if total elements > 20 (one page of data)
- Centered at bottom of drawer
- Uses same style as rest of app

### Current Implementation
```typescript
<Pagination
  current={page}
  pageSize={20}
  total={data.totalElements}
  onChange={onPageChange}
/>
```

### Query Cache Key
`["user-tracking", userId, page]` - Separate cache per user and page

---

## Integration Points

### 1. Admin User Table Action Menu
```
User Row Actions:
  ✓ View Bid History (existing)
  ✓ View Account Tracking (NEW)
  ✓ Block/Unblock User
```

### 2. State Management
```typescript
// In AdminUserPage:
const [historyDrawer, setHistoryDrawer] = useState<{
  visible: boolean;
  type: "bid" | "violation" | "tracking";
  userId?: number;
}>;
const [trackingPage, setTrackingPage] = useState(1);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
```

### 3. Drawer Routing
```
historyDrawer.type === "bid" → Show Bid History Table
historyDrawer.type === "violation" → Show Violations (mock)
historyDrawer.type === "tracking" → Show AccountTrackingDrawer (NEW)
```

---

## Component Props

### AccountTrackingDrawer
```typescript
interface AccountTrackingDrawerProps {
  visible: boolean;              // Show/hide drawer
  userId: number | null;         // User ID to fetch tracking for
  user: User | null;             // User object for header display
  onClose: () => void;           // Close handler
  page: number;                  // Current pagination page
  onPageChange: (page: number) => void; // Pagination handler
}
```

---

## Data Flow

```
User clicks "View Account Tracking"
        ↓
selectedUser = record (store for header)
trackingPage = 1 (reset pagination)
historyDrawer.type = "tracking" (signal to show tracking drawer)
        ↓
AccountTrackingDrawer visible = true
        ↓
useQuery(['user-tracking', userId, page])
        ↓
adminApi.getTrackingUser(userId, page, 20)
        ↓
GET /users/{userId}/tracking?page={page}&size=20
        ↓
Backend returns PageResponse<UserTrackingResponse>
        ↓
Component maps each tracking item to UI:
  - Fraud items → Red fraud card
  - Block items → Volcano block card
  - Unblock items → Green unblock card
  - Others → Blue generic card
        ↓
Timeline displays chronologically (newest first from backend)
Pagination shown if needed
```

---

## Mapping Algorithm (TrackingItem Component)

```typescript
1. Check if fraudType OR bidId in details
   ✓ YES → Render fraud card with special formatting
   ✓ NO  → Go to step 2

2. Check if reason OR by in details
   ✓ YES → Render admin action card with reason box
   ✓ NO  → Go to step 3

3. Fallback: Generic rendering
   ✓ Render card with all detail fields as tags
```

### Code Location
[TrackingItem Component in AccountTrackingDrawer.tsx](src/components/admin/AccountTrackingDrawer.tsx#L30-L180)

---

## Error Handling

### API Errors
- Caught in try-catch within adminApi
- Logged to console
- useQuery will display error state
- User sees message: "Failed to fetch user tracking"

### Network Issues
- useQuery automatic retry with exponential backoff (default 3 retries)
- Loading state shows Skeleton components
- Graceful degradation if data unavailable

### Empty State
- Shows Empty component with text "No tracking history found"
- Centered in drawer with proper spacing

---

## Testing Checklist

### Setup
- [ ] User account with tracking history exists in backend
- [ ] Backend returns proper UserTrackingResponse structure
- [ ] Pagination test data (>20 records) available

### Feature Tests
- [ ] Click "View Account Tracking" from user actions menu
- [ ] Drawer opens with correct user name/email in header
- [ ] Tracking records display in timeline
- [ ] Fraud items show red alert card with proper formatting
- [ ] Block/unblock items show with correct colors
- [ ] Generic tracking items display as tags
- [ ] Timestamps format correctly (DD/MM/YYYY HH:mm:ss)
- [ ] Pagination appears when total > 20 items
- [ ] Page change loads new data
- [ ] Close button works correctly
- [ ] Loading spinner shows during data fetch

### Edge Cases
- [ ] User with no tracking history
- [ ] Fraud item missing optional fields (auctionId, description)
- [ ] Admin action missing by field
- [ ] Very long reason/description text truncates properly
- [ ] Special characters in data display correctly
- [ ] Rapid page changes don't cause race conditions

---

## Performance Considerations

### Query Caching
- Each `[userId, page]` combination cached separately
- Prevents unnecessary re-fetches on navigation
- Manual invalidation if admin performs action

### Pagination
- Only 20 records fetched per page
- Reduces initial load time
- Shows only pagination controls when needed (>20 items)

### Component Optimization
- TrackingItem memoized for list items
- Timeline built with useMemo
- Unnecessary re-renders prevented

---

## Future Enhancements

1. **Filtering**
   - Filter by action type (FRAUD, BLOCK, etc.)
   - Date range filtering

2. **Sorting**
   - Sort by date (ascending/descending)
   - Sort by action type

3. **Export**
   - Export tracking history as CSV/PDF
   - Send via email

4. **Real-time Updates**
   - WebSocket for live tracking events
   - Notification when new tracking added

5. **Detail Modal**
   - Click tracking item to see full details
   - JSON viewer for complex objects

---

## Troubleshooting

### Drawer Not Opening
- Check historyDrawer.type is "tracking"
- Verify userId is not null
- Check browser console for errors

### Data Not Loading
- Verify API endpoint: `/users/{userId}/tracking`
- Check network tab for actual request
- Ensure backend returns correct pageSize/totalElements

### Formatting Issues
- dayjs locale might need configuration
- Check timezone conversion
- Verify createdAt is ISO 8601 format from backend

---

## API Endpoint Reference

**Backend Controller**: `UserController.java`
```java
@GetMapping("/{userId}/tracking")
public ApiResponse<PageResponse<UserTrackingResponse>> getTrackingUser(
    @RequestParam Long userId,
    @RequestParam(value = "page", defaultValue = "1") int page,
    @RequestParam(value = "size", defaultValue = "20") int size
)
```

**Response Format**:
```json
{
  "code": 1000,
  "result": {
    "totalPage": 2,
    "pageSize": 20,
    "currentPage": 1,
    "totalElements": 35,
    "data": [
      {
        "id": 1,
        "actionType": "FRAUD_DETECTED",
        "createdAt": "2024-01-25T10:30:00Z",
        "details": {
          "fraudType": "MULTIPLE_ACCOUNTS",
          "bidId": 123,
          "auctionId": 456,
          "description": "User detected using multiple accounts"
        }
      },
      // ... more tracking records
    ]
  }
}
```

---

## Implementation Status
✅ **COMPLETE** - All files created and integrated
- Types defined
- API method added  
- Component created with dynamic mapping
- Integration in AdminUserPage complete
- Error handling and loading states included
- Pagination implemented

Ready for testing with backend endpoint.

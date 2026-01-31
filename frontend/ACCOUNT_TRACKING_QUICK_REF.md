# Account Tracking Feature - Quick Reference

## Quick Start

### What Does It Do?
Shows complete audit history for any user - fraud detections, blocks, unblocks, and system actions - in a beautiful timeline view.

### How to Use (Admin)
1. Go to Admin > User Management
2. Find the user you want to track
3. Click "⋮" (three dots) next to their name
4. Select "View Account Tracking"
5. Browse their history with pagination

---

## Feature Highlights

### 🚨 Fraud Detection
- **Red alert card** when fraud is detected
- Shows: Fraud Type, Bid ID, Auction ID, Description
- Makes it easy to spot at a glance

### 🔒 Block/Unblock Actions
- **Color-coded cards**: 
  - 🔒 Red for blocks
  - 🔓 Green for unblocks
- Shows: Admin who performed action, Reason given
- Reason highlighted in special box

### 📋 Generic Tracking
- Flexible fallback for any tracking type
- Shows all data as labeled tags
- Prevents data loss from new action types

### ⏱️ Timestamps
- Auto-converted to local time
- Format: DD/MM/YYYY HH:mm:ss
- No timezone confusion

### 📄 Pagination
- Loads 20 records per page
- Pagination controls appear when needed
- Smooth page transitions

---

## Component Structure

```
AccountTrackingDrawer
├── Header: "Tracking History: user@email.com"
├── Timeline (main content)
│   ├── TrackingItem #1 (Fraud)
│   │   └── Red card with fraud details
│   ├── TrackingItem #2 (Block)
│   │   └── Volcano card with admin action
│   └── TrackingItem #N (Generic)
│       └── Blue card with all details
└── Pagination (if needed)
```

---

## Data Mapping Examples

### Example 1: Fraud Detection
```json
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
}
```
**Renders as**: Red card with fraud alert, showing all details

### Example 2: User Blocked
```json
{
  "id": 2,
  "actionType": "USER_BLOCKED",
  "createdAt": "2024-01-24T15:20:00Z",
  "details": {
    "reason": "Suspicious bidding activity and anti-snipe violations",
    "by": "admin@system.com"
  }
}
```
**Renders as**: Volcano card with admin info and reason box

### Example 3: System Update
```json
{
  "id": 3,
  "actionType": "ACCOUNT_VERIFIED",
  "createdAt": "2024-01-23T09:00:00Z",
  "details": {
    "verificationMethod": "EMAIL",
    "timestamp": "2024-01-23T09:00:00Z"
  }
}
```
**Renders as**: Blue card with all fields as tags

---

## API Integration Details

### Query Hook Setup
```typescript
const { data, isLoading } = useQuery<PageResponse<UserTrackingResponse>>({
  queryKey: ["user-tracking", userId, page],
  queryFn: () => adminApi.getTrackingUser(userId!, page, 20),
  enabled: visible && !!userId,
});
```

### API Method
```typescript
adminApi.getTrackingUser(userId: number, page: number, size: number)
```

### Request
```
GET /users/{userId}/tracking?page=1&size=20
```

### Response
```typescript
{
  totalPage: 2,
  pageSize: 20,
  currentPage: 1,
  totalElements: 35,
  data: UserTrackingResponse[]
}
```

---

## State Management in AdminUserPage

```typescript
// Type definition
historyDrawer: {
  visible: boolean;           // Show/hide drawer
  type: "bid" | "violation" | "tracking";  // Which drawer to show
  userId?: number;            // User ID to fetch for
}

// Current user being viewed
selectedUser: User | null;

// Pagination
trackingPage: number;
```

### Opening the Drawer
```typescript
setSelectedUser(record);      // Store user for header
setTrackingPage(1);          // Reset to page 1
setHistoryDrawer({
  visible: true,
  type: "tracking",
  userId: record.id,
});
```

### Closing the Drawer
```typescript
setHistoryDrawer({ visible: false, type: "bid" });
setSelectedUser(null);
setTrackingPage(1);
```

---

## Customization Options

### Change Page Size
In `AccountTrackingDrawer.tsx`:
```typescript
// Line: queryFn: () => adminApi.getTrackingUser(userId!, page, 20)
// Change 20 to your desired page size (e.g., 50)
```

### Add More Action Types
In `TrackingItem` component, add cases to `getIconAndColor()`:
```typescript
if (actionType.includes("YOUR_ACTION")) {
  return {
    icon: <YourIcon />,
    color: "yourColor",
    label: "Your Label",
  };
}
```

### Change Timeline Appearance
Modify the Timeline component props:
```typescript
<Timeline>
  {timelineItems}
</Timeline>
```

---

## Troubleshooting

### "No tracking history found"
- ✓ User truly has no tracking records
- ✓ Backend not returning data
- Check: Network tab for API response

### Drawer not opening
- Check: `historyDrawer.type === "tracking"`
- Check: `userId` is not null
- Check: Browser console for errors

### Timestamps show wrong time
- Check: Backend sending ISO 8601 format
- Check: dayjs locale configuration
- Check: User's browser timezone

### Pagination not showing
- Check: Total records > 20
- Check: `totalElements` value in response
- Pagination only shows when needed

---

## Performance Tips

### Caching
- Data is cached per `[userId, page]` combination
- Switching pages only fetches needed data
- No unnecessary API calls

### Lazy Loading
- Component only fetches when drawer opens (`enabled: visible && !!userId`)
- Doesn't load data until needed

### Pagination Strategy
- Shows 20 records per page
- Reduces initial load time
- Better for users with many tracking records

---

## Testing Scenarios

### Scenario 1: Fresh User
- User has 0 tracking records
- **Expected**: Empty state with message

### Scenario 2: Single Page
- User has 15 tracking records
- **Expected**: All records visible, no pagination

### Scenario 3: Multiple Pages
- User has 45 tracking records
- **Expected**: 20 on page 1, pagination controls shown
- **Clicking page 2**: Loads records 21-40

### Scenario 4: Mixed Actions
- User has fraud + blocks + system updates
- **Expected**: Each type formatted correctly (color, icon, layout)

---

## Code References

### Files Modified
1. `src/api/types.ts` - Added UserTrackingResponse type
2. `src/api/adminApi.ts` - Added getTrackingUser method
3. `src/pages/admin/AdminUserPage.tsx` - Integration and state

### Files Created
1. `src/components/admin/AccountTrackingDrawer.tsx` - Main component

### Documentation
- `ACCOUNT_TRACKING_IMPLEMENTATION.md` - Full implementation guide
- This file - Quick reference

---

## Next Steps

1. ✅ Implementation complete
2. 🧪 Test with backend endpoint
3. 🚀 Deploy to staging
4. 📊 Monitor usage
5. 🔄 Gather feedback for improvements

---

## FAQ

**Q: Can I export the tracking history?**
A: Not yet, but it's on the roadmap. Currently you can screenshot/copy data.

**Q: Why are some tracking items not colored?**
A: Generic system actions use blue. Add custom colors by extending `getIconAndColor()`.

**Q: How often is tracking data updated?**
A: In real-time as actions occur. Data is cached but can be invalidated manually.

**Q: Can regular users see tracking history?**
A: No, only admins can access this feature via the Admin panel.

**Q: What if details map is empty?**
A: Component handles it gracefully - shows card with action type only.

---

## Support & Feedback

For issues or feature requests:
1. Check troubleshooting section above
2. Review ACCOUNT_TRACKING_IMPLEMENTATION.md for details
3. Contact development team with:
   - User ID
   - Action type
   - Expected vs actual behavior

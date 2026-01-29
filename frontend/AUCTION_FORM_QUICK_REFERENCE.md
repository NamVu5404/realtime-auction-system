# Auction Form & Cancel Workflow - Quick Reference

## Components Created

### 1. AuctionForm.tsx
**Location:** `src/features/auction/AuctionForm.tsx`

**Props:**
```typescript
interface AuctionFormProps {
  form: FormInstance;
  auction?: Auction;  // Required for edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}
```

**Usage:**
```tsx
<AuctionForm
  form={form}
  mode="create"
  onSuccess={() => setCreateModal(false)}
  onCancel={() => setCreateModal(false)}
/>
```

**Modes:**
- `create`: Draft + Schedule options
- `edit`: Context-aware based on auction status

---

### 2. CancelAuctionModal.tsx
**Location:** `src/components/admin/CancelAuctionModal.tsx`

**Props:**
```typescript
interface CancelAuctionModalProps {
  visible: boolean;
  auctionId?: number;
  auctionTitle?: string;
  onCancel: () => void;
  onSuccess: () => void;
}
```

**Usage:**
```tsx
<CancelAuctionModal
  visible={isCancelModalOpen}
  auctionId={selectedAuctionId}
  auctionTitle={selectedAuctionTitle}
  onCancel={handleClose}
  onSuccess={handleSuccess}
/>
```

---

### 3. statusUtils.ts
**Location:** `src/utils/statusUtils.ts`

**Function:**
```typescript
export const getStatusColor = (status: AuctionStatus): string
```

**Usage:**
```tsx
<Tag color={getStatusColor(auction.status)}>
  {auction.status}
</Tag>
```

**Color Mapping:**
- DRAFT → 'default' (grey)
- SCHEDULED → 'blue'
- LIVE → 'green'
- ENDED → 'red'
- CANCELLED → 'red'

---

## API Methods Added

### adminApi.ts

**New Methods:**
```typescript
// Update Draft Auction (all fields editable)
updateDraftAuction(auctionId: number, updateData: any): Promise<Auction>

// Update Scheduled Auction (time fields + metadata only)
updateScheduledAuction(auctionId: number, updateData: any): Promise<Auction>
```

**Updated Methods:**
```typescript
// Cancel endpoint uses PATCH (was POST)
cancelAuction(auctionId: number): Promise<void>
```

---

## Feature Highlights

### Create Form
| Action | Required Fields | Result |
|--------|-----------------|--------|
| Save Draft | title | DRAFT status |
| Schedule | All (title, price, times, image) | SCHEDULED status |

### Edit Form
| Status | Locked Fields | Actions |
|--------|---------------|---------|
| DRAFT | None | Update Draft / Publish |
| SCHEDULED | startPrice, minStep | Update |

### Cancel Modal
- Opens without API call
- Requires reason >= 10 characters
- Shows character counter
- Confirms before calling API

### Lock-out Check
- 1-second interval check
- Disables Edit/Cancel buttons when `now >= startTime`
- Real-time protection for SCHEDULED → LIVE transition

---

## Form Validation

### Time Validation
```javascript
// startTime must be at least 1 minute from now
startTime.isBefore(now.add(1, 'minute')) → ERROR
startTime.isAfter(now.add(1, 'minute')) → OK
```

### Monetary Validation
```javascript
// Prices must be positive decimals
value >= 0.01 → OK
value < 0.01 → ERROR
```

### Time Range Validation
```javascript
// endTime must be after startTime
endTime.isAfter(startTime) → OK
endTime.isBefore(startTime) → ERROR
```

---

## Integration in AdminAuctionPage

### State Management
```typescript
const [createModal, setCreateModal] = useState(false);
const [editModal, setEditModal] = useState<{
  visible: boolean;
  auction?: Auction;
}>({ visible: false });

const [cancelModal, setCancelModal] = useState<{
  visible: boolean;
  auctionId?: number;
  auctionTitle?: string;
}>({ visible: false });

const [liveAuctions, setLiveAuctions] = useState<Set<number>>(new Set());
```

### 1-Second Lock-out Check
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const now = dayjs();
    const updated = new Set<number>();

    if (data?.data) {
      data.data.forEach((auction) => {
        if (auction.status === AuctionStatus.SCHEDULED) {
          const startTimeLocal = convertUTCToLocal(auction.startTime);
          if (now.isAfter(startTimeLocal) || now.isSame(startTimeLocal)) {
            updated.add(auction.id);
          }
        }
      });
    }

    setLiveAuctions(updated);
  }, 1000);

  return () => clearInterval(interval);
}, [data?.data]);
```

### Button Disable Logic
```typescript
const canEdit = 
  (record.status === AuctionStatus.DRAFT ||
   record.status === AuctionStatus.SCHEDULED) &&
  !isLiveNow;

const canCancel = 
  (record.status === AuctionStatus.DRAFT ||
   record.status === AuctionStatus.SCHEDULED) &&
  !isLiveNow;
```

---

## Action Flows

### Create Auction Flow
```
[Create Modal] 
  ↓
[AuctionForm - Create Mode]
  ├─ Save Draft
  │  ├─ Validate title only
  │  └─ POST /auctions/draft → DRAFT
  └─ Schedule
     ├─ Validate all fields
     └─ POST /auctions/scheduler → SCHEDULED
  ↓
[Refetch] → Update table
```

### Edit Auction Flow
```
[Edit Button] → [Check Status]
  ├─ DRAFT
  │  ├─ [AuctionForm - Edit DRAFT]
  │  ├─ Update Draft → PUT /auctions/{id}/draft
  │  └─ Publish → Validate all → PUT /auctions/{id}/draft
  └─ SCHEDULED
     ├─ [AuctionForm - Edit SCHEDULED]
     └─ Update → PUT /auctions/{id}/scheduler
  ↓
[Refetch] → Update table
```

### Cancel Auction Flow
```
[Cancel Button] → [Check if still cancellable]
  ├─ If now >= startTime
  │  └─ Show Error: "Cannot cancel: Auction has already started"
  └─ If now < startTime
     ├─ [CancelAuctionModal]
     ├─ User enters reason (min 10 chars)
     ├─ [Confirm Cancellation]
     └─ PATCH /auctions/{id}/cancel
     ↓
     [Refetch] → Update table
```

---

## Key Validation Rules

### All Modes
- ✅ Title: Required, non-empty string

### Save Draft
- ✅ Title only (other fields optional)

### Schedule / Publish
- ✅ Title: Required
- ✅ Description: Required
- ✅ Image: Required
- ✅ Start Price: Required, >= 0.01
- ✅ Min Step: Required, >= 0.01
- ✅ Start Time: Required, >= now + 1 minute
- ✅ End Time: Required, > startTime

### Cancel
- ✅ Reason: Required, >= 10 characters

---

## Status Colors (Ant Design Tags)

```
Tag color="default"  → DRAFT (grey)
Tag color="blue"     → SCHEDULED
Tag color="green"    → LIVE
Tag color="red"      → ENDED, CANCELLED
```

---

## Testing Scenarios

### Happy Path - Create Draft
1. Click "Create Auction"
2. Enter title
3. Click "Save Draft"
4. ✅ Auction created with DRAFT status

### Happy Path - Schedule Auction
1. Click "Create Auction"
2. Fill all fields (title, description, prices, times, image)
3. Click "Schedule"
4. ✅ Auction created with SCHEDULED status

### Happy Path - Edit Draft & Publish
1. Click "Edit" on DRAFT auction
2. Update fields
3. Click "Update Draft"
4. Re-open and click "Publish"
5. ✅ DRAFT → SCHEDULED

### Happy Path - Edit Scheduled
1. Click "Edit" on SCHEDULED auction
2. Verify startPrice is disabled
3. Verify minStep is disabled
4. Update title/description/times
5. Click "Update"
6. ✅ Auction updated

### Happy Path - Cancel with Reason
1. Click "Cancel" on DRAFT/SCHEDULED auction
2. Modal opens
3. Type 10+ character reason
4. "Confirm Cancellation" becomes enabled
5. Click "Confirm"
6. ✅ Auction cancelled

### Edge Case - Lock-out on Start Time
1. Create SCHEDULED auction starting in 5 seconds
2. Verify "Edit" and "Cancel" visible
3. Wait 5 seconds
4. Verify buttons disappear within 1 second
5. ✅ Real-time protection works

---

## Debugging Tips

### Form Not Updating
```typescript
// Check if form instance is passed correctly
<AuctionForm form={form} mode="edit" auction={auction} />
```

### Cancel Modal Not Showing
```typescript
// Check state update
setCancelModal({
  visible: true,
  auctionId: auction.id,
  auctionTitle: auction.title
});
```

### Lock-out Not Working
```typescript
// Check if convertUTCToLocal is being used
const startTimeLocal = convertUTCToLocal(auction.startTime);
const now = dayjs(); // Local time
```

### API Call Failing
```typescript
// Ensure adminApi methods are updated
adminApi.updateDraftAuction(id, data)
adminApi.updateScheduledAuction(id, data)
adminApi.cancelAuction(id)
```

---

## Performance Notes

- **1-second interval:** Uses cleanup to prevent memory leaks
- **Form validation:** Async validators for time checks
- **Query invalidation:** Only invalidates relevant queries
- **Re-renders:** Optimized with proper dependency arrays
- **Lock-out set:** O(1) lookup for disabled state checks

---

## Accessibility

- Form labels associated with inputs
- ARIA descriptions on disabled fields
- Clear error messages for validation
- High contrast status colors
- Keyboard navigation support (Ant Design)
- TextArea for longer text input

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Timezone handling via dayjs
- FormData support for file uploads

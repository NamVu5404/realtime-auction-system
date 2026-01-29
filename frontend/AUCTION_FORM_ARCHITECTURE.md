# Auction System - Component Architecture & Data Flow

## Component Hierarchy

```
AdminAuctionPage
├── Search Bar
│   ├── Keyword Input
│   ├── Date Range Picker
│   └── Status Tabs (ALL, LIVE, DRAFT, SCHEDULED, ENDED, CANCELLED)
├── Auction Table
│   ├── Columns: Image, Title, Creator, Times, Status, Actions
│   └── Actions Menu (Dynamic)
│       ├── View Detail
│       ├── Edit (conditional)
│       ├── Cancel (conditional)
│       └── View Logs (conditional)
├── Create Auction Modal
│   └── AuctionForm (mode: 'create')
│       ├── Title Input
│       ├── Description TextArea
│       ├── Image Upload
│       ├── Price Fields
│       ├── Time Fields
│       └── Actions: [Save Draft] [Schedule]
├── Edit Auction Modal
│   └── AuctionForm (mode: 'edit', auction)
│       ├── Title Input
│       ├── Description TextArea
│       ├── Image Upload
│       ├── Price Fields (conditional lock)
│       ├── Time Fields
│       └── Actions: [Update Draft/Publish] OR [Update]
├── CancelAuctionModal
│   ├── TextArea: Reason (10+ chars required)
│   ├── Character Counter
│   └── Actions: [Close] [Confirm Cancellation]
└── AuctionDetailDrawer
    ├── Tabs
    │   ├── Overview
    │   │   └── Descriptions (Status, Creator, Details, Times)
    │   └── Bid Logs
    │       └── Table (Time, Bidder, Amount)
    │           └── WebSocket listener for LIVE auctions
    └── Close Button
```

---

## Data Flow Diagram

### Create Auction Flow

```
User Clicks "Create"
        ↓
setCreateModal(true)
        ↓
[Create Modal Opens]
        ↓
[AuctionForm - mode: 'create']
        ↓
User selects action
    ├─ Save Draft
    │   ├─ form.getFieldValue('title') → required
    │   ├─ Prepare FormData
    │   └─ POST /auctions/draft
    │       ↓
    │       Response: { id, title, status: 'DRAFT', ... }
    │       ↓
    │       [createMutation.onSuccess]
    │       ├─ message.success()
    │       ├─ Invalidate queries
    │       ├─ setCreateModal(false)
    │       ├─ refetch()
    │       └─ Table updates
    │
    └─ Schedule
        ├─ Validate ALL fields
        │  ├─ Title: required
        │  ├─ Description: required
        │  ├─ Image: required
        │  ├─ Prices: >= 0.01
        │  ├─ startTime: >= now + 1 min
        │  └─ endTime: > startTime
        ├─ Prepare FormData
        └─ POST /auctions/scheduler
            ↓
            Response: { id, title, status: 'SCHEDULED', ... }
            ↓
            [Same as above]
```

---

### Edit Auction Flow

```
User Clicks "Edit"
    ↓
[Check auction.status]
    ├─ DRAFT
    │   ├─ setEditModal({ visible: true, auction })
    │   ├─ AuctionForm initializes with data
    │   ├─ All fields editable
    │   └─ Actions: [Update Draft] [Publish]
    │       ├─ Update Draft
    │       │   └─ PUT /auctions/{id}/draft
    │       │       ↓ stays DRAFT
    │       └─ Publish
    │           ├─ Validate ALL fields
    │           └─ PUT /auctions/{id}/draft
    │               ↓ still DRAFT (backend decides)
    │
    └─ SCHEDULED
        ├─ setEditModal({ visible: true, auction })
        ├─ AuctionForm initializes with data
        ├─ startPrice: disabled (read-only)
        ├─ minStep: disabled (read-only)
        ├─ Other fields: editable
        └─ Actions: [Update]
            └─ PUT /auctions/{id}/scheduler
                ↓ stays SCHEDULED
                ↓
                [updateMutation.onSuccess]
                ├─ message.success()
                ├─ Invalidate queries
                ├─ refetch()
                └─ Table updates
```

---

### Cancel Auction Flow

```
User Clicks "Cancel"
    ↓
[Check if cancellable]
    ├─ now >= startTime
    │   └─ message.error("Cannot cancel: Auction has already started")
    │
    └─ now < startTime
        ├─ setCancelModal({
        │     visible: true,
        │     auctionId,
        │     auctionTitle
        │   })
        ├─ [CancelAuctionModal opens]
        ├─ User types reason
        │   └─ onChange: setReasonLength(value.length)
        ├─ Confirm button logic
        │   └─ disabled = reasonLength < 10
        ├─ User clicks "Confirm Cancellation"
        └─ form.validateFields()
            ├─ Validate reason >= 10 chars
            └─ PATCH /auctions/{id}/cancel
                ↓
                [cancelMutation.onSuccess]
                ├─ message.success()
                ├─ Invalidate queries
                ├─ refetch()
                ├─ setCancelModal({ visible: false })
                └─ Table updates (status: CANCELLED, red tag)
```

---

### 1-Second Lock-out Check

```
useEffect - runs every time data changes
    ↓
setInterval (1000ms)
    ├─ const now = dayjs() [local time]
    ├─ For each auction in data
    │   └─ If status === SCHEDULED
    │       ├─ const startTimeLocal = convertUTCToLocal(auction.startTime)
    │       ├─ If now >= startTime
    │       │   └─ updated.add(auction.id)
    │       └─ Else
    │           └─ (don't add to set)
    │
    └─ setLiveAuctions(updated)
        ↓
        Re-render table
        ├─ For each action menu
        │   ├─ const isLiveNow = liveAuctions.has(record.id)
        │   ├─ const canEdit = !isLiveNow && (DRAFT || SCHEDULED)
        │   └─ const canCancel = !isLiveNow && (DRAFT || SCHEDULED)
        │       ├─ If canEdit/canCancel → Show button
        │       └─ Else → Hide button
```

---

## AuctionForm State Machine

```
┌─────────────┐
│   DRAFT     │
│   Status    │
└─────────────┘

CREATE MODE:
  ┌─────────────────────────┐
  │   Save Draft            │
  │   (title only)          │
  └────────────┬────────────┘
               ↓
        DRAFT Status
               ↑
  ┌─────────────────────────┐
  │   Schedule              │
  │   (all fields)          │
  └────────────┬────────────┘
               ↓
        SCHEDULED Status


EDIT MODE - DRAFT:
  ┌──────────────────────┐
  │  Update Draft        │
  │  (all fields)        │
  └────────────┬─────────┘
               ↓
        DRAFT Status
               ↑
  ┌──────────────────────┐
  │  Publish             │
  │  (full validation)   │
  └────────────┬─────────┘
               ↓
        SCHEDULED Status


EDIT MODE - SCHEDULED:
  ┌──────────────────────┐
  │  Update              │
  │  (metadata + times)  │
  │  (price locked)      │
  └────────────┬─────────┘
               ↓
        SCHEDULED Status


CANCEL (from any status):
  ┌──────────────────────┐
  │  Cancel Auction      │
  │  (reason required)   │
  └────────────┬─────────┘
               ↓
        CANCELLED Status
```

---

## Form Validation State Machine

```
                    ┌──────────────────┐
                    │  INITIAL STATE   │
                    │  (empty form)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         [Save Draft]  [Schedule]      [Update]
              │              │              │
    ┌─────────▼─┐   ┌─────────▼─┐  ┌─────────▼─┐
    │  VALIDATE │   │  VALIDATE │  │ VALIDATE  │
    │  TITLE    │   │  ALL      │  │ CONTEXT   │
    └────┬──────┘   └────┬──────┘  └────┬──────┘
         │                │              │
    ┌────▼──────────┐    │         ┌─────▼────────┐
    │ TITLE OK?     │    │         │ EDIT DRAFT?  │
    └────┬──────────┘    │         └────┬─────────┘
         │ YES           │              │
         ├─ [SUBMIT]     │         ┌────▼─────────┐
         │                │        │ VALIDATE ALL │
    [API CALL]        ┌────▼──────┐ (for Publish)│
         │            │ ALL VALID?│────┬─────────┘
         │            └────┬──────┘    │
         │                 │ YES       │
         │            ├─ [SUBMIT]    [SUBMIT]
         │            │                │
         │      [API CALL]       [API CALL]
         │            │                │
         ↓            ↓                ↓
    ┌──────────────────────────────────┐
    │     SUCCESS / ERROR HANDLING      │
    │  ├─ Message                      │
    │  ├─ Refetch queries              │
    │  └─ Close modal                  │
    └──────────────────────────────────┘
```

---

## CancelAuctionModal State Machine

```
┌─────────────────────────┐
│   Modal Hidden          │
│   visible = false       │
└────────────┬────────────┘
             │ setCancelModal({ visible: true })
             ↓
┌─────────────────────────┐
│   Modal Visible         │
│   visible = true        │
│                         │
│   reason = ""           │
│   isLoading = false     │
└────────────┬────────────┘
             │
      ┌──────┴──────────┐
      │                 │
  [User Types]      [User Clicks Close]
      │                 │
      ↓                 ↓
 setReasonLength()   handleCancel()
      │                 │
      ├─ < 10 chars     └──→ setCancelModal({ visible: false })
      │   └─ Button disabled    ↓
      ├─ >= 10 chars    ┌──────────────────┐
      │   └─ Button enabled   │   Modal Hidden  │
      │                        └─────────────────┘
      │
      └─ [User Clicks Confirm]
         │
         ├─ setIsLoading(true)
         ├─ form.validateFields()
         ├─ adminApi.cancelAuction(id)
         │
         ├─ SUCCESS
         │   ├─ message.success()
         │   ├─ Invalidate queries
         │   ├─ setCancelModal({ visible: false })
         │   ├─ setIsLoading(false)
         │   └─ onSuccess() → refetch()
         │
         └─ ERROR
             ├─ message.error()
             ├─ setIsLoading(false)
             └─ Modal stays open
```

---

## Status & Visibility Matrix

```
Status      │ Create | Edit | Cancel | View Detail | View Logs | Color
────────────┼────────┼─────┼────────┼─────────────┼───────────┼──────
DRAFT       │   -    │  ✓  │   ✓   │      ✓      │     -     │ grey
SCHEDULED   │   -    │  ✓  │   ✓*  │      ✓      │     -     │ blue
LIVE        │   -    │  ✗  │   ✗   │      ✓      │     ✓     │ green
ENDED       │   -    │  ✗  │   ✗   │      ✓      │     ✓     │ red
CANCELLED   │   -    │  ✗  │   -   │      ✓      │     -     │ red

Legend:
✓  = Available/Visible
✗  = Not available (button disabled or hidden)
-  = Not applicable
*  = Disabled if now >= startTime (lock-out check)
```

---

## API Call Sequence Diagram

```
CREATE DRAFT
┌────────┐
│ Client │
└────┬───┘
     │ POST /auctions/draft
     │ { title: "...", ... }
     ├──────────────────────────────────────┐
                                       Backend
     │                                      │
     │◄─────── 201 Created ────────────────
     │ { id, title, status: 'DRAFT', ... }
     │
     └─► queryClient.invalidateQueries()


CREATE SCHEDULED
┌────────┐
│ Client │
└────┬───┘
     │ POST /auctions/scheduler
     │ { title, description, startPrice, minStep, startTime, endTime, ... }
     ├──────────────────────────────────────┐
                                       Backend
     │                                      │
     │◄─────── 201 Created ────────────────
     │ { id, title, status: 'SCHEDULED', ... }
     │
     └─► queryClient.invalidateQueries()


UPDATE DRAFT
┌────────┐
│ Client │
└────┬───┘
     │ PUT /auctions/{id}/draft
     │ { title, description, startPrice, minStep, startTime, endTime, ... }
     ├──────────────────────────────────────┐
                                       Backend
     │                                      │
     │◄─────── 200 OK ────────────────
     │ { id, title, status: 'DRAFT', ... }
     │
     └─► queryClient.invalidateQueries()


UPDATE SCHEDULED
┌────────┐
│ Client │
└────┬───┘
     │ PUT /auctions/{id}/scheduler
     │ { title, description, image, startTime, endTime }
     ├──────────────────────────────────────┐
                                       Backend
     │                                      │
     │◄─────── 200 OK ────────────────
     │ { id, title, status: 'SCHEDULED', ... }
     │
     └─► queryClient.invalidateQueries()


CANCEL AUCTION
┌────────┐
│ Client │
└────┬───┘
     │ PATCH /auctions/{id}/cancel
     ├──────────────────────────────────────┐
                                       Backend
     │                                      │
     │◄─────── 200 OK ────────────────
     │ { id, title, status: 'CANCELLED', ... }
     │
     └─► queryClient.invalidateQueries()
```

---

## Key State Variables

```typescript
// AdminAuctionPage.tsx

// Modal visibility
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
const [detailDrawer, setDetailDrawer] = useState<{
  visible: boolean;
  auction?: Auction;
}>({ visible: false });

// Lock-out check
const [liveAuctions, setLiveAuctions] = useState<Set<number>>(new Set());

// Search & filter
const [page, setPage] = useState(1);
const [keyword, setKeyword] = useState("");
const [status, setStatus] = useState<AuctionStatus>(AuctionStatus.LIVE);
const [dateRange, setDateRange] = useState<any>(null);

// Form instances
const [form] = Form.useForm();  // Create form
const [editForm] = Form.useForm();  // Edit form
```

---

## Dependency Graph

```
AuctionForm.tsx
├─ adminApi.createAuction
├─ adminApi.updateDraftAuction
├─ adminApi.updateScheduledAuction
├─ convertUTCToLocal (dateUtils)
└─ Form validation utilities

CancelAuctionModal.tsx
├─ adminApi.cancelAuction
└─ Form validation

AdminAuctionPage.tsx
├─ AuctionForm
├─ CancelAuctionModal
├─ AuctionDetailDrawer
├─ adminApi.filterAuctions
├─ adminApi.cancelAuction
├─ useQuery (React Query)
├─ useMutation (React Query)
├─ useDebounce
├─ convertUTCToLocal (dateUtils)
├─ getStatusColor (statusUtils)
└─ formatDateTime (format utils)

AuctionDetailDrawer.tsx
├─ useAuctionWebsocket
├─ formatCurrency (format utils)
├─ formatDateTime (format utils)
└─ getStatusColor (statusUtils)

statusUtils.ts
└─ AuctionStatus enum (types)
```

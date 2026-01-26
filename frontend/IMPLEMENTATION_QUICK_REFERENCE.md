# Quick Reference - Frontend Backend Integration

## File Locations & Purposes

### Core API Files
| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/api/types.ts` | TypeScript types from backend | `Auction`, `AuctionStatus`, `ApiResponse`, `PageResponse` |
| `src/api/auctionApi.ts` | API endpoints | `getAuctionsByStatus()`, `getAuctionDetail()`, `placeBid()` |

### Utilities
| File | Purpose | Key Functions |
|------|---------|---|
| `src/utils/dateUtils.ts` | Timezone conversion | `convertUTCToLocal()`, `formatAuctionTime()`, `getTimeRemaining()` |
| `src/hooks/useAuctions.ts` | React Query hooks | `useAuctions()`, `useAuctionDetail()` |

### Components
| File | Purpose | Props |
|------|---------|-------|
| `src/pages/HomePage.tsx` | Main dashboard | Tabs for LIVE/UPCOMING/ENDED |
| `src/pages/AuctionDetailPage.tsx` | Auction details | Bid form, countdown |
| `src/features/auction/AuctionCard.tsx` | Card component | `auction`, `onCountdownComplete` |
| `src/features/auction/AuctionList.tsx` | Grid layout | `auctions`, `onCountdownComplete` |
| `src/features/auction/Countdown.tsx` | Timer | `targetTime`, `onFinish`, `isLive` |

---

## Common Tasks

### Fetch Auctions by Status
```typescript
import { useAuctions } from '../hooks/useAuctions';
import { AuctionStatus } from '../api/types';

const { data, isLoading, error } = useAuctions(
  AuctionStatus.LIVE,  // or SCHEDULED, ENDED
  1,                   // page (1-indexed)
  20                   // page size
);

// data.data = Auction[]
// data.totalElements = total count
// data.currentPage = current page
```

### Display Time in Local Timezone
```typescript
import { formatAuctionTime, convertUTCToLocal } from '../utils/dateUtils';

// Format: "Jan 25, 2024 2:30 PM"
const displayTime = formatAuctionTime(auction.startTime);

// Or get Dayjs object
const localTime = convertUTCToLocal(auction.startTime);
```

### Calculate Time Remaining
```typescript
import { getTimeRemaining, formatCountdown } from '../utils/dateUtils';

const remainingMs = getTimeRemaining(auction.endTime);
const timerDisplay = formatCountdown(remainingMs); // "01:23:45"
```

### Place Bid
```typescript
import { auctionApi } from '../api/auctionApi';

try {
  await auctionApi.placeBid(auctionId, bidAmount);
  message.success('Bid placed!');
} catch (error) {
  message.error('Bid failed');
}
```

### Trigger Auction Refetch
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// When countdown finishes or status needs sync
queryClient.invalidateQueries({ queryKey: ['auctions'] });
```

---

## Type Usage Cheat Sheet

### Auction Type
```typescript
import { Auction, AuctionStatus } from '../api/types';

const auction: Auction = {
  id: 1,
  title: 'Vintage Camera',
  status: AuctionStatus.LIVE,
  startTime: '2024-01-25T14:00:00Z',  // UTC string
  endTime: '2024-01-25T15:00:00Z',
  startPrice: 100,
  currentPrice: 450,
  minStep: 10,
  seller: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER',
    avatarUrl: 'https://...'
  },
  highestBidder: {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'USER',
    avatarUrl: 'https://...'
  }
};
```

### PageResponse Type
```typescript
import { PageResponse, Auction } from '../api/types';

const response: PageResponse<Auction> = {
  totalPage: 5,           // total pages
  pageSize: 20,           // items per page
  currentPage: 1,         // current page (1-indexed)
  totalElements: 95,      // total items
  data: [...]             // Auction[]
};
```

### API Response Type
```typescript
import { ApiResponse, PageResponse, Auction } from '../api/types';

const response: ApiResponse<PageResponse<Auction>> = {
  code: 1000,             // success code
  message: 'Success',
  result: { ... }         // The actual data
};
```

---

## Common Patterns

### Pattern: List with Pagination
```typescript
const [page, setPage] = useState(1);
const { data } = useAuctions(AuctionStatus.LIVE, page, 20);

return (
  <>
    {data?.data.map(auction => (
      <AuctionCard key={auction.id} auction={auction} />
    ))}
    <Pagination 
      current={data?.currentPage}
      total={data?.totalElements}
      onChange={setPage}
    />
  </>
);
```

### Pattern: Countdown with Refetch
```typescript
const { data } = useAuctions(...);
const queryClient = useQueryClient();

const handleCountdownComplete = () => {
  // Refetch to get new status from backend
  queryClient.invalidateQueries({ queryKey: ['auctions'] });
};

return (
  <Countdown
    targetTime={auction.endTime}
    onFinish={handleCountdownComplete}
    isLive
  />
);
```

### Pattern: Conditional Rendering by Status
```typescript
{auction.status === AuctionStatus.LIVE && (
  <div>Current Price: ${auction.currentPrice}</div>
)}

{auction.status === AuctionStatus.SCHEDULED && (
  <div>Starting Price: ${auction.startPrice}</div>
)}

{auction.status === AuctionStatus.ENDED && (
  <div>Final Price: ${auction.currentPrice}</div>
)}
```

### Pattern: Tab Switching with Reset
```typescript
const statusMap: Record<string, AuctionStatus> = {
  'live': AuctionStatus.LIVE,
  'scheduled': AuctionStatus.SCHEDULED,
  'ended': AuctionStatus.ENDED
};

const handleTabChange = (key: string) => {
  setActiveTab(key);
  setPage(1);  // Reset to page 1
};
```

---

## Debugging Tips

### Check Timezone Conversion
```typescript
import { convertUTCToLocal, formatAuctionTime } from '../utils/dateUtils';

const utcTime = '2024-01-25T14:30:00Z';
console.log('UTC:', utcTime);
console.log('Local:', convertUTCToLocal(utcTime).format());
console.log('Formatted:', formatAuctionTime(utcTime));
```

### Debug React Query Cache
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log(queryClient.getQueryData(['auctions', 'LIVE', 1, 20]));
```

### Check Countdown State
```typescript
const remainingMs = getTimeRemaining(auction.endTime);
console.log('Remaining ms:', remainingMs);
console.log('Formatted:', formatCountdown(remainingMs));
console.log('Minutes:', Math.floor(remainingMs / 60000));
```

### Verify API Response
```typescript
import { auctionApi } from '../api/auctionApi';

try {
  const data = await auctionApi.getAuctionsByStatus('LIVE', 1, 20);
  console.log('Response:', data);
} catch (error) {
  console.error('Error:', error);
}
```

---

## Backend Endpoints Quick Guide

### GET /auctions
Fetch paginated auctions by status

**Query Parameters:**
- `status` (required): `LIVE`, `SCHEDULED`, or `ENDED`
- `page` (optional, default: 1): Page number (1-indexed)
- `size` (optional, default: 20): Items per page

**Response:**
```json
{
  "code": 1000,
  "result": {
    "totalPage": 5,
    "pageSize": 20,
    "currentPage": 1,
    "totalElements": 95,
    "data": [
      {
        "id": 1,
        "title": "Vintage Camera",
        "startTime": "2024-01-25T14:00:00Z",
        ...
      }
    ]
  }
}
```

### GET /auctions/{id}
Fetch single auction details

**Response:**
```json
{
  "code": 1000,
  "result": {
    "id": 1,
    "title": "Vintage Camera",
    ...
  }
}
```

### POST /bids/place
Place a bid (requires authentication)

**Request Body:**
```json
{
  "auctionId": 1,
  "bidAmount": 500.00
}
```

**Response:**
```json
{
  "code": 1000,
  "result": {
    ...
  }
}
```

---

## Configuration Constants

### Pagination
```typescript
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE = 1;
```

### Timing
```typescript
const STALE_TIME = 5000;              // 5 seconds
const COUNTDOWN_UPDATE_INTERVAL = 1000; // 1 second
const ONE_HOUR_MS = 3600000;
```

### Timezone
```typescript
// Automatic - uses browser's local timezone
import dayjs from 'dayjs';
dayjs.tz.guess(); // "America/New_York", etc.
```

---

## Migration from Old Types

### Old → New
```typescript
// Old (deprecated)
import { AuctionItem } from '../types';

// New (use this)
import { Auction } from '../api/types';
```

### Old Props → New Props
```typescript
// Old auction object
auction.imageUrl     // → auction.image
auction.sellerId     // → auction.seller.id
auction.sellerName   // → auction.seller.name
auction.highestBidderId     // → auction.highestBidder.id
auction.highestBidderName   // → auction.highestBidder.name
```

---

## Frequently Asked Questions

**Q: Why is my time showing wrong?**
A: Use `convertUTCToLocal()` on UTC strings before displaying.

**Q: How do I reset pagination?**
A: Call `setPage(1)` when changing tabs or applying filters.

**Q: Why isn't countdown updating?**
A: Ensure dayjs plugins are extended and you're using `getTimeRemaining()`.

**Q: When should I call `invalidateQueries`?**
A: When countdown reaches 0, user performs action, or manual refresh.

**Q: How do I handle loading states?**
A: Use `isLoading` from `useAuctions()` hook.

**Q: Can I disable refetching on window focus?**
A: Yes, it's already disabled in `useAuctions()` hook.

---

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [dayjs Documentation](https://day.js.org/)
- [Ant Design Components](https://ant.design/components/overview/)
- Backend Documentation: See `IMPLEMENTATION_SUMMARY_DETAILED.md`

---

**Last Updated**: January 23, 2026
**Status**: ✅ Ready for Production

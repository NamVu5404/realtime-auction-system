# Migration Guide: Old Types → New Backend-Integrated Types

## Overview
This guide helps you migrate from the old mock-based types to the new backend-integrated types.

---

## Type Mapping

### Auction Types

#### OLD: AuctionItem
```typescript
// ❌ OLD - Don't use
import { AuctionItem } from '../types';

interface AuctionItem {
  id: string;                    // String ID
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  startPrice: number;
  currentPrice: number;
  minStep: number;
  status: AuctionStatus;
  sellerId: string;              // Separate ID
  sellerName: string;            // Just name
  imageUrl?: string;             // Old field name
  highestBidderId?: string;      // Separate ID
  highestBidderName?: string;    // Just name
}
```

#### NEW: Auction
```typescript
// ✅ NEW - Use this
import { Auction, AuctionStatus } from '../api/types';

interface Auction {
  id: number;                    // Numeric ID
  title: string;
  description: string;
  startTime: string;             // UTC ISO string
  endTime: string;               // UTC ISO string
  startPrice: number;
  currentPrice: number;
  minStep: number;
  status: AuctionStatus;
  image?: string;                // Renamed field
  seller: User;                  // Full User object
  highestBidder?: User | null;   // Full User object
  antiSnipeSeconds: number;      // New fields
  extensionSeconds: number;
  createdAt: string;
}
```

### API Response Types

#### OLD: ApiResponse
```typescript
// ❌ OLD
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
```

#### NEW: ApiResponse
```typescript
// ✅ NEW - Same structure, properly typed from backend
export interface ApiResponse<T> {
  code: number;    // Default: 1000
  message?: string;
  result: T;
}
```

### User Types

#### OLD: No User type
```typescript
// ❌ OLD - User info scattered
const auction = {
  sellerId: 'user-123',
  sellerName: 'John',
  highestBidderId: 'user-456',
  highestBidderName: 'Jane'
};
```

#### NEW: User interface
```typescript
// ✅ NEW - Structured user data
import { User } from '../api/types';

const user: User = {
  id: 123,
  email: 'john@example.com',
  name: 'John',
  role: 'USER',
  avatarUrl: 'https://...'
};

const auction = {
  seller: user,
  highestBidder: user
};
```

---

## Code Migration Examples

### Example 1: Display Auction Title

#### OLD
```typescript
import { AuctionItem } from '../types';

interface Props {
  auction: AuctionItem;
}

export const AuctionCard = ({ auction }: Props) => {
  return <h1>{auction.title}</h1>;
};
```

#### NEW
```typescript
import { Auction } from '../api/types';

interface Props {
  auction: Auction;
}

export const AuctionCard = ({ auction }: Props) => {
  return <h1>{auction.title}</h1>;
};
```

---

### Example 2: Display Seller Name

#### OLD
```typescript
<div>
  <p>Seller: {auction.sellerName}</p>
</div>
```

#### NEW
```typescript
<div>
  <p>Seller: {auction.seller?.name}</p>
  <p>Email: {auction.seller?.email}</p>
  {auction.seller?.avatarUrl && (
    <img src={auction.seller.avatarUrl} alt={auction.seller.name} />
  )}
</div>
```

---

### Example 3: Display Image

#### OLD
```typescript
const isValid = auction.imageUrl && !auction.imageUrl.includes('via.placeholder');
<img src={isValid ? auction.imageUrl : DEFAULT} alt={auction.title} />
```

#### NEW
```typescript
const isValid = auction.image && !auction.image.includes('placeholder');
<img src={isValid ? auction.image : DEFAULT} alt={auction.title} />
```

---

### Example 4: Fetch and Display Auctions

#### OLD - Mock API
```typescript
// ❌ OLD
import { auctionApi } from '../api/auctionApi';

const [auctions, setAuctions] = useState<AuctionItem[]>([]);

useEffect(() => {
  auctionApi.getAllAuctions().then(setAuctions);
}, []);

return auctions.map(a => <AuctionCard key={a.id} auction={a} />);
```

#### NEW - Real API with React Query
```typescript
// ✅ NEW
import { useAuctions } from '../hooks/useAuctions';
import { AuctionStatus } from '../api/types';

const { data } = useAuctions(AuctionStatus.LIVE, 1, 20);

return data?.data.map(a => (
  <AuctionCard key={a.id} auction={a} />
));
```

---

### Example 5: Display Times

#### OLD - Manual dayjs
```typescript
import dayjs from 'dayjs';

const now = dayjs();
const startTime = dayjs(auction.startTime);
const timeTilStart = startTime.diff(now);
```

#### NEW - Using dateUtils
```typescript
import { getTimeRemaining, formatAuctionTime } from '../utils/dateUtils';

const timeTilStart = getTimeRemaining(auction.startTime);
const formattedTime = formatAuctionTime(auction.startTime);

<div>{formattedTime}</div>  // "Jan 25, 2024 2:30 PM"
```

---

### Example 6: Status Checks

#### OLD
```typescript
if (auction.status === 'LIVE') { ... }
if (auction.status === 'SCHEDULED') { ... }
```

#### NEW - Using enum
```typescript
import { AuctionStatus } from '../api/types';

if (auction.status === AuctionStatus.LIVE) { ... }
if (auction.status === AuctionStatus.SCHEDULED) { ... }
```

---

### Example 7: Highest Bidder Display

#### OLD
```typescript
{auction.highestBidderId && (
  <div>
    <p>Highest Bidder: {auction.highestBidderName}</p>
  </div>
)}
```

#### NEW
```typescript
{auction.highestBidder && (
  <div>
    <p>Highest Bidder: {auction.highestBidder.name}</p>
    <p>Email: {auction.highestBidder.email}</p>
    {auction.highestBidder.avatarUrl && (
      <img 
        src={auction.highestBidder.avatarUrl} 
        alt={auction.highestBidder.name}
      />
    )}
  </div>
)}
```

---

### Example 8: Pagination

#### OLD - Not supported in old implementation
```typescript
// ❌ OLD - All auctions in one array
const auctions = await auctionApi.getAllAuctions();
```

#### NEW - Full pagination support
```typescript
// ✅ NEW
import { useAuctions } from '../hooks/useAuctions';

const [page, setPage] = useState(1);
const { data } = useAuctions(status, page, 20);

<Pagination 
  current={data?.currentPage}
  total={data?.totalElements}
  pageSize={data?.pageSize}
  onChange={setPage}
/>
```

---

### Example 9: Place Bid

#### OLD - Mock API
```typescript
// ❌ OLD
const response = await auctionApi.placeBid({
  auctionId: auction.id,
  bidAmount: bidAmount
});
```

#### NEW - Real API
```typescript
// ✅ NEW
import { auctionApi } from '../api/auctionApi';

await auctionApi.placeBid(auction.id, bidAmount);
// Note: ID is number, not string
```

---

### Example 10: Price Display

#### OLD
```typescript
<div>${auction.currentPrice}</div>
```

#### NEW - With formatting
```typescript
<div>${auction.currentPrice.toFixed(2)}</div>
// Ensures proper decimal display: 450.00
```

---

## Property Mapping Reference

| OLD Property | NEW Property | Change | Reason |
|---|---|---|---|
| `AuctionItem` | `Auction` | Type renamed | Better naming |
| `id: string` | `id: number` | Type change | Backend uses numeric IDs |
| `imageUrl` | `image` | Field renamed | Backend field name |
| `sellerId` | `seller.id` | Restructured | Object now contains full user |
| `sellerName` | `seller.name` | Restructured | Object now contains full user |
| `highestBidderId` | `highestBidder?.id` | Restructured | Object now contains full user |
| `highestBidderName` | `highestBidder?.name` | Restructured | Object now contains full user |
| N/A | `seller.email` | Added | New field from backend |
| N/A | `seller.role` | Added | New field from backend |
| N/A | `seller.avatarUrl` | Added | New field from backend |
| N/A | `antiSnipeSeconds` | Added | Backend feature |
| N/A | `extensionSeconds` | Added | Backend feature |
| N/A | `createdAt` | Added | Backend field |

---

## Import Path Changes

### OLD Imports
```typescript
// ❌ OLD
import { AuctionItem, AuctionStatus, ApiResponse } from '../types';
import { auctionApi } from '../api/auctionApi';
```

### NEW Imports
```typescript
// ✅ NEW
import { Auction, AuctionStatus, ApiResponse } from '../api/types';
import { auctionApi } from '../api/auctionApi';
import { useAuctions, useAuctionDetail } from '../hooks/useAuctions';
import { formatAuctionTime, getTimeRemaining } from '../utils/dateUtils';
```

---

## Component Update Checklist

When updating a component, check these items:

- [ ] Import changed from `../types` to `../api/types`
- [ ] Type name `AuctionItem` → `Auction`
- [ ] Property `imageUrl` → `image`
- [ ] Access patterns like `auction.sellerName` → `auction.seller?.name`
- [ ] ID comparisons: string → number (or use numeric comparison)
- [ ] Times: Using `convertUTCToLocal()` instead of raw `dayjs()`
- [ ] API calls: Using real endpoints instead of mock
- [ ] Data fetching: Using `useAuctions()` hook instead of state + useEffect
- [ ] Error handling: Updated for real API responses
- [ ] Types: All properly imported from `../api/types`

---

## Breaking Changes

### None - Backward Compatibility
The old `AuctionItem` type is still available in `src/types/index.ts` for backward compatibility.

However, all new code should use the new `Auction` type from `src/api/types.ts`.

---

## FAQ

**Q: Can I still use the old types?**
A: The old `AuctionItem` is still exported from `src/types/index.ts` but shouldn't be used in new code.

**Q: Why is ID now a number?**
A: Backend uses numeric IDs (Long in Java). String IDs were only for mock data.

**Q: What if highestBidder is null?**
A: Use optional chaining: `auction.highestBidder?.name` or check: `if (auction.highestBidder) { ... }`

**Q: How do I migrate a large component?**
A: Use Find & Replace:
- Search: `AuctionItem` → Replace: `Auction`
- Search: `imageUrl` → Replace: `image`
- Then manually fix property access patterns

**Q: Are times still in UTC?**
A: Yes, backend sends UTC. Use `formatAuctionTime()` to display in local timezone.

**Q: When should I use useAuctions?**
A: For list pages with pagination. Use `useAuctionDetail()` for detail pages.

---

## Migration Checklist

### Step 1: Update Imports
```bash
# Search & replace in all files
OLD: import { ... } from '../types'
NEW: import { ... } from '../api/types'
```

### Step 2: Rename Type
```bash
# Search & replace
OLD: AuctionItem
NEW: Auction
```

### Step 3: Update Properties
- [ ] `imageUrl` → `image`
- [ ] `sellerName` → `seller?.name`
- [ ] `sellerId` → `seller?.id`
- [ ] `highestBidderName` → `highestBidder?.name`
- [ ] `highestBidderId` → `highestBidder?.id`

### Step 4: Update API Calls
- [ ] Replace `auctionApi.getAllAuctions()` with `useAuctions()`
- [ ] Replace `auctionApi.getAuctionById(id)` with `useAuctionDetail(id)`
- [ ] Update bid calls to pass numeric ID

### Step 5: Update Time Handling
- [ ] Replace `dayjs(time)` with `convertUTCToLocal(time)`
- [ ] Replace manual formatting with `formatAuctionTime(time)`
- [ ] Use `getTimeRemaining()` for countdowns

### Step 6: Test
- [ ] Verify types compile: `npm run lint`
- [ ] Check UI displays correctly
- [ ] Test with real backend API
- [ ] Verify all times show in local timezone

---

## Performance Tips After Migration

1. Use React Query hooks (no useState for fetching)
2. Leverage `keepPreviousData` for smooth transitions
3. Use `invalidateQueries` strategically
4. Avoid unnecessary component re-renders
5. Cache for 5-10 seconds to reduce API calls

---

## Support

For issues during migration:
1. Check `IMPLEMENTATION_QUICK_REFERENCE.md`
2. Review `IMPLEMENTATION_SUMMARY_DETAILED.md`
3. See working examples in updated components
4. Check TypeScript compiler errors: `npm run lint`

---

**Happy Migrating! 🚀**

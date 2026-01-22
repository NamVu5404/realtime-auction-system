# API Contract & Integration Guide

This document specifies the API contracts expected from the backend and how the frontend integrates with them.

## Base URLs

```
API: http://localhost:8080/api
WebSocket: ws://localhost:8080/ws  (or http://localhost:8080/ws for SockJS)
```

Configure in `.env.local`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

## Authentication Endpoints

### 1. Exchange Google Auth Code for Tokens

**Endpoint:** `POST /api/auth/token`

**Request:**
```
Content-Type: application/x-www-form-urlencoded

code=<google_auth_code>
```

**Frontend Code:**
```typescript
// src/api/authApi.ts
const response = await axios.post(`${API_BASE_URL}/auth/token`, 
  { code },
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "role": "USER"
  }
}
```

**Error (400):**
```json
{
  "error": "Invalid authorization code",
  "message": "The provided code is invalid or expired"
}
```

**Implementation Notes:**
- Frontend calls this after receiving code from Google OAuth
- `expiresIn` specifies token lifetime in seconds (typically 3600)
- `role` can be "USER" or "ADMIN"
- Avatar is optional

---

### 2. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Request Headers:**
```
Authorization: Bearer <refresh_token>
```

**Request Body:**
```json
{
  "refreshToken": "<refresh_token_value>"
}
```

**Frontend Code:**
```typescript
// Automatically called by Axios interceptor on 401
const response = await axiosClient.post('/auth/refresh', {
  refreshToken: authStore.refreshToken
});
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "role": "USER"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid or expired refresh token",
  "message": "Please login again"
}
```

**Implementation Notes:**
- Called automatically when access token expires (returns 401)
- Retry queue holds failed requests during refresh
- Original request automatically retried with new token
- If refresh fails, user is logged out

---

### 3. Logout (Optional)

**Endpoint:** `POST /api/auth/logout`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Frontend Code:**
```typescript
await authApi.logout(); // Called on logout
useAuthStore.logout();  // Clear local state
```

---

## Auction Endpoints

### 1. Get All Auctions

**Endpoint:** `GET /api/auctions`

**Query Parameters (Optional):**
```
?status=LIVE,SCHEDULED,ENDED
?sort=startTime:ASC
?page=0&size=20
```

**Response (200):**
```json
{
  "content": [
    {
      "id": "auction-123",
      "title": "Vintage Camera Collection",
      "description": "Rare vintage cameras from the 1950s-1970s",
      "startTime": "2025-01-22T14:00:00Z",
      "endTime": "2025-01-22T15:00:00Z",
      "startPrice": 100.0,
      "currentPrice": 450.0,
      "minStep": 10.0,
      "status": "LIVE",
      "sellerId": "seller-1",
      "sellerName": "John Collector",
      "imageUrl": "https://...",
      "highestBidderId": "bidder-5",
      "highestBidderName": "Emma Wilson"
    },
    // ... more auctions
  ],
  "totalElements": 50,
  "totalPages": 3,
  "currentPage": 0,
  "pageSize": 20
}
```

**Frontend Integration:**
```typescript
// src/api/auctionApi.ts
const data = await auctionApi.getAllAuctions();

// src/pages/HomePage.tsx
const { data: allAuctions } = useQuery({
  queryKey: ['auctions'],
  queryFn: auctionApi.getAllAuctions
});
```

---

### 2. Get Auction by ID

**Endpoint:** `GET /api/auctions/{auctionId}`

**Response (200):**
```json
{
  "id": "auction-123",
  "title": "Vintage Camera Collection",
  "description": "Rare vintage cameras from the 1950s-1970s",
  "startTime": "2025-01-22T14:00:00Z",
  "endTime": "2025-01-22T15:00:00Z",
  "startPrice": 100.0,
  "currentPrice": 450.0,
  "minStep": 10.0,
  "status": "LIVE",
  "sellerId": "seller-1",
  "sellerName": "John Collector",
  "imageUrl": "https://...",
  "highestBidderId": "bidder-5",
  "highestBidderName": "Emma Wilson"
}
```

**Error (404):**
```json
{
  "error": "Not Found",
  "message": "Auction not found"
}
```

---

### 3. Place Bid

**Endpoint:** `POST /api/bids/place`

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "auctionId": "auction-123",
  "bidAmount": 500.0
}
```

**Frontend Code:**
```typescript
// src/features/auction/AuctionCard.tsx
const response = await auctionApi.placeBid({
  auctionId: auction.id,
  bidAmount: bidAmount
});
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bid placed successfully",
  "currentPrice": 500.0,
  "bidId": "bid-456"
}
```

**Error (400) - Invalid Bid:**
```json
{
  "success": false,
  "message": "Bid amount must be at least 460.00",
  "currentPrice": 450.0
}
```

**Error (400) - Auction Not Live:**
```json
{
  "success": false,
  "message": "Auction is not currently LIVE",
  "currentPrice": 450.0
}
```

**Error (403) - Fraud Detected:**
```json
{
  "success": false,
  "message": "Bid rejected: Suspicious activity detected",
  "violationCode": "RATE_LIMIT_EXCEEDED"
}
```

**Implementation Notes:**
- Requires authentication (Bearer token)
- Validates bid >= currentPrice + minStep
- Returns fraud detection response codes
- Real-time price sent back for UI update

---

### 4. Get Bid History

**Endpoint:** `GET /api/auctions/{auctionId}/bids`

**Response (200):**
```json
{
  "bids": [
    {
      "bidId": "bid-1",
      "bidderId": "bidder-1",
      "bidderName": "John Smith",
      "amount": 150.0,
      "timestamp": "2025-01-22T14:05:00Z"
    },
    {
      "bidId": "bid-2",
      "bidderId": "bidder-2",
      "bidderName": "Jane Doe",
      "amount": 175.0,
      "timestamp": "2025-01-22T14:06:00Z"
    },
    {
      "bidId": "bid-3",
      "bidderId": "bidder-3",
      "bidderName": "Mike Johnson",
      "amount": 200.0,
      "timestamp": "2025-01-22T14:07:00Z"
    }
  ]
}
```

---

## WebSocket Events

### Connection & Subscription

**Connect to WebSocket:**
```
ws://localhost:8080/ws
Protocol: STOMP 1.2
```

**Subscribe to Price Updates:**
```
SUBSCRIBE
destination:/topic/auctions
id:sub-0

```

**Subscribe to Personal Notifications:**
```
SUBSCRIBE
destination:/user/queue/notifications
id:sub-1

```

### Price Update Event

**Topic:** `/topic/auctions`

**Message Format:**
```json
{
  "auctionId": "auction-123",
  "currentPrice": 500.0,
  "highestBidderId": "bidder-5",
  "highestBidderName": "Emma Wilson",
  "timestamp": "2025-01-22T14:07:30Z"
}
```

**Frontend Handler:**
```typescript
// src/hooks/useWebSocket.ts
const { onPriceUpdate } = useWebSocket({
  onPriceUpdate: (event: PricePingEvent) => {
    // Update auction price in state
    setAllAuctions(prev =>
      prev.map(auction =>
        auction.id === event.auctionId
          ? { ...auction, currentPrice: event.currentPrice }
          : auction
      )
    );
  }
});
```

### Bid Result Notification

**Topic:** `/user/queue/notifications`

**Success Message:**
```json
{
  "type": "BID_SUCCESS",
  "auctionId": "auction-123",
  "message": "Your bid was accepted",
  "currentPrice": 500.0,
  "status": "WINNING"
}
```

**Failure Message:**
```json
{
  "type": "BID_FAILED",
  "auctionId": "auction-123",
  "message": "Bid amount too low. Current price: 450.00",
  "currentPrice": 450.0,
  "status": "OUTBID"
}
```

**Fraud Message:**
```json
{
  "type": "BID_BLOCKED",
  "auctionId": "auction-123",
  "message": "Your account has suspicious activity. Bid blocked.",
  "reasonCode": "RATE_LIMIT_EXCEEDED",
  "status": "BLOCKED"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "<Error Type>",
  "message": "<Detailed message>",
  "timestamp": "2025-01-22T14:00:00Z",
  "path": "/api/endpoint"
}
```

### HTTP Status Codes

| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| 200 | Success | Proceed |
| 400 | Bad Request | Show error message |
| 401 | Unauthorized | Attempt token refresh |
| 403 | Forbidden | Redirect to home/show access denied |
| 404 | Not Found | Show 404 page or error message |
| 409 | Conflict | Show concurrency error (race condition) |
| 429 | Too Many Requests | Show rate limit message |
| 500 | Server Error | Show generic error, suggest retry |

### Frontend Error Handling

```typescript
// Axios interceptor automatically handles 401
// In components:
try {
  const response = await auctionApi.placeBid(request);
  if (response.success) {
    message.success(response.message);
  } else {
    message.error(response.message);
  }
} catch (error) {
  if (error.response?.status === 401) {
    // Axios already handles refresh
    // If we get here, logout was triggered
  } else if (error.response?.status === 403) {
    message.error('Access denied');
  } else {
    message.error('An error occurred');
  }
}
```

---

## Integration Checklist

- [ ] Backend running on `http://localhost:8080`
- [ ] `/api/auth/token` endpoint implemented
- [ ] `/api/auth/refresh` endpoint implemented
- [ ] `/api/auctions` GET endpoint returns mock data
- [ ] `/api/bids/place` POST endpoint accepts bids
- [ ] WebSocket at `/ws` with SockJS support
- [ ] `/topic/auctions` topic broadcasts price updates
- [ ] All endpoints return proper error responses
- [ ] CORS headers configured for frontend origin
- [ ] JWT tokens signed and validated
- [ ] Refresh token rotation implemented (optional)

---

## Testing the Integration

### 1. Test Authentication Flow

```bash
# Get auth code from Google OAuth
code=<google_auth_code>

# Exchange for tokens
curl -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=$code"

# Response should include accessToken
```

### 2. Test Auction Endpoints

```bash
# Get all auctions
curl http://localhost:8080/api/auctions \
  -H "Authorization: Bearer <token>"

# Place a bid
curl -X POST http://localhost:8080/api/bids/place \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"auctionId":"auction-1","bidAmount":500}'
```

### 3. Test WebSocket

```javascript
// In browser console
const client = new StompJs.Client({
  brokerURL: 'ws://localhost:8080/ws',
  onConnect: () => {
    console.log('Connected to WebSocket');
    client.subscribe('/topic/auctions', (msg) => {
      console.log('Price update:', JSON.parse(msg.body));
    });
  }
});
client.activate();
```

---

## Mock Data Structure

When backend is not ready, use mock data from `src/api/auctionApi.ts`:

```typescript
generateMockAuctions(): AuctionItem[] {
  // 2 LIVE auctions
  // 2 SCHEDULED < 1 hour
  // 2 SCHEDULED > 1 hour
  // 2 ENDED auctions
}
```

Switch to real API by updating imports:
```typescript
// Before
import { auctionApi } from 'src/api/auctionApi';

// After
import { auctionApiReal as auctionApi } from 'src/api/auctionApi';
```

---

## Performance Considerations

- **Polling Frequency:** WebSocket recommended (real-time)
- **Fallback:** Implement polling if WebSocket unavailable
- **Caching:** React Query caches auction data for 5 minutes
- **Pagination:** Implement for auctions list (20 items per page)
- **Lazy Loading:** Load bid history on demand
- **Rate Limiting:** Frontend should limit bid placement to 1 per second

---

## Security Notes

- All endpoints (except `/api/auth/token`) require `Authorization: Bearer <token>`
- CORS must be configured on backend
- Tokens should be httpOnly cookies (frontend uses localStorage for development)
- Refresh token should have longer expiration than access token
- WebSocket connections should require authentication

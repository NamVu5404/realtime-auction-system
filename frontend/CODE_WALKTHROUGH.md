# Real-Time Bidding System - Code Walkthrough

## Table of Contents
1. [File Structure](#file-structure)
2. [API Integration](#api-integration)
3. [WebSocket Hook](#websocket-hook)
4. [Component Integration](#component-integration)
5. [Type System](#type-system)

---

## File Structure

```
frontend/src/
├── api/
│   ├── auctionApi.ts          ← Updated: placeBid endpoint
│   └── types.ts               ← Updated: PlaceBidResponse, BidUpdateMessage
├── hooks/
│   ├── useAuctionWebsocket.ts ← NEW: Main WebSocket hook (261 lines)
│   └── useAuth.ts
├── pages/
│   └── AuctionDetailPage.tsx  ← Updated: Integrated bidding system
└── types/
    └── sockjs-client.d.ts     ← NEW: Type declarations
```

---

## API Integration

### File: `src/api/auctionApi.ts`

**What Changed**:
- Updated `placeBid` function signature
- Changed endpoint from `/bids/place` to `/auctions/{auctionId}/bids`
- Added proper request body format: `{ auctionId, bidderId, amount }`
- Added `PlaceBidResponse` return type

**Before**:
```typescript
placeBid: async (auctionId: number, bidAmount: number): Promise<any> => {
  const response = await axiosClient.post<ApiResponse<any>>(
    `/bids/place`,
    {
      auctionId,
      bidAmount,
    }
  );
```

**After**:
```typescript
placeBid: async (auctionId: number, bidderId: number, amount: number): Promise<PlaceBidResponse> => {
  const response = await axiosClient.post<ApiResponse<PlaceBidResponse>>(
    `/auctions/${auctionId}/bids`,  // Correct path
    {
      auctionId,
      bidderId,      // New parameter
      amount,        // Renamed from bidAmount
    }
  );
```

**Why**:
- Matches backend endpoint specification exactly
- Includes all required parameters (bidderId crucial for backend)
- Type-safe return value for proper error handling
- Follows RESTful conventions (resource in path)

---

## WebSocket Hook

### File: `src/hooks/useAuctionWebsocket.ts` (261 lines)

#### Part 1: Interfaces

```typescript
interface UseAuctionWebsocketOptions {
  auctionId: number;
  onBidUpdate?: (message: BidUpdateMessage) => void;
  onTimeExtended?: (newEndTime: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

interface UseAuctionWebsocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  lastBidTime?: number;
}
```

**Purpose**: Type-safe configuration and return values

#### Part 2: Refs and State

```typescript
const clientRef = useRef<Client | null>(null);
const connectingRef = useRef(false);
const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const subscriptionRef = useRef<any | null>(null);

const queryClient = useQueryClient();
const [isConnected, setIsConnected] = useState(false);
const [isReconnecting, setIsReconnecting] = useState(false);
const [lastBidTime, setLastBidTime] = useState<number | undefined>();
```

**Purpose**:
- `clientRef`: Holds STOMP client instance across renders
- `connectingRef`: Prevents multiple concurrent connection attempts
- `reconnectTimeoutRef`: Manages reconnection scheduling
- `subscriptionRef`: Stores active subscription
- `queryClient`: React Query for cache invalidation
- State variables: Track connection status for UI

#### Part 3: Helper Functions

**clearReconnectTimeout**
```typescript
const clearReconnectTimeout = useCallback(() => {
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
  }
}, []);
```
Cleans up pending reconnection attempts.

**scheduleReconnect**
```typescript
const scheduleReconnect = useCallback(() => {
  clearReconnectTimeout();
  setIsReconnecting(true);
  
  reconnectTimeoutRef.current = setTimeout(() => {
    connect();
  }, 5000); // 5-second delay
}, [auctionId]);
```
Schedules reconnection attempt after 5 seconds.

#### Part 4: handleDisconnect

```typescript
const handleDisconnect = useCallback(() => {
  setIsConnected(false);
  onDisconnect?.();
  console.log(`Disconnected from auction ${auctionId} updates`);
  scheduleReconnect();
}, [auctionId, onDisconnect, scheduleReconnect]);
```

**Flow**:
1. Update UI state (red indicator)
2. Call user callback
3. Schedule reconnection attempt
4. Prevents immediate reconnect spam

#### Part 5: handleReconnect

```typescript
const handleReconnect = useCallback(() => {
  setIsConnected(true);
  setIsReconnecting(false);
  clearReconnectTimeout();
  
  console.log(`Successfully reconnected to auction ${auctionId} updates`);
  
  // **CRITICAL**: Sync with server
  queryClient.invalidateQueries({ 
    queryKey: ['auction', auctionId] 
  });
  
  onConnect?.();
}, [auctionId, queryClient, onConnect, clearReconnectTimeout]);
```

**Key Feature**: Cache invalidation ensures UI gets fresh data after network recovery.

#### Part 6: handleBidUpdate

```typescript
const handleBidUpdate = useCallback(
  (message: Message) => {
    try {
      const bidUpdate = JSON.parse(message.body) as BidUpdateMessage;
      
      console.log('Bid update received:', bidUpdate);
      setLastBidTime(Date.now());

      // Call user callback to update local state
      onBidUpdate?.(bidUpdate);

      // Handle time extension
      if (bidUpdate.extended && bidUpdate.newEndTime) {
        console.log(`Auction ${auctionId} time extended to:`, bidUpdate.newEndTime);
        onTimeExtended?.(bidUpdate.newEndTime);

        // Visual alert
        notification.info({
          message: 'Time Extended!',
          description: `Auction time extended due to new bid!`,
          duration: 3,
          style: {
            backgroundColor: '#FFC107',
            color: '#000',
          },
        });
      }

      // Global notification for new bid
      notification.success({
        message: 'New Bid Placed',
        description: `${bidUpdate.highestBidderName} đã đặt giá $${bidUpdate.currentPrice.toFixed(2)}!`,
        duration: 3,
      });
    } catch (error) {
      console.error('Failed to parse bid update message:', error);
    }
  },
  [auctionId, onBidUpdate, onTimeExtended]
);
```

**Flow**:
1. Parse incoming WebSocket message
2. Call user-provided callback (updates component state)
3. Check for time extension
4. Show gold notification for extension
5. Show success notification for bid
6. Error handling for malformed messages

#### Part 7: connect

```typescript
const connect = useCallback(() => {
  if (clientRef.current?.connected || connectingRef.current) {
    return; // Prevent duplicate connections
  }

  connectingRef.current = true;

  try {
    const wsUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:8080/ws';
    
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        'Content-Type': 'application/json',
      },
      debug: (str) => {
        if (str.includes('CONNECT') || str.includes('DISCONNECT')) {
          console.log('[STOMP]', str);
        }
      },
      // **CRITICAL**: Heartbeat configuration
      heartbeatIncoming: 10000, // 10 seconds
      heartbeatOutgoing: 10000, // 10 seconds
      reconnectDelay: 0,         // We handle reconnection manually
      
      onConnect: () => {
        connectingRef.current = false;
        console.log(`Connected to auction ${auctionId} WebSocket`);

        // Subscribe to auction topic
        const topic = `/topic/auction/${auctionId}`;
        subscriptionRef.current = client.subscribe(topic, handleBidUpdate);

        handleReconnect();
      },

      onStompError: (frame) => {
        connectingRef.current = false;
        const errorMsg = `WebSocket error for auction ${auctionId}: ${frame.headers['message']}`;
        console.error(errorMsg);
        onError?.(errorMsg);
        handleDisconnect();
      },

      onWebSocketClose: () => {
        connectingRef.current = false;
        console.log(`WebSocket closed for auction ${auctionId}`);
        handleDisconnect();
      },

      onWebSocketError: (event: Event) => {
        connectingRef.current = false;
        const errorMsg = `WebSocket error for auction ${auctionId}`;
        console.error(errorMsg, event);
        onError?.(errorMsg);
        handleDisconnect();
      },
    });

    clientRef.current = client;
    client.activate();
  } catch (error) {
    connectingRef.current = false;
    const errorMsg = `Failed to initialize WebSocket for auction ${auctionId}: ${error}`;
    console.error(errorMsg);
    onError?.(errorMsg);
    handleDisconnect();
  }
}, [auctionId, handleBidUpdate, handleReconnect, handleDisconnect, onError]);
```

**Key Points**:
- Prevents multiple concurrent connections
- Environment-aware WebSocket URL
- 10-second heartbeat for connection health
- Three error handlers (STOMP error, WebSocket close, WebSocket error)
- Subscribes to auction-specific topic on connect
- Comprehensive error handling with fallbacks

#### Part 8: Effects

```typescript
useEffect(() => {
  connect();

  return () => {
    disconnect();
  };
}, [auctionId, connect, disconnect]);
```

**Lifecycle**:
- Mount: Connect to WebSocket
- Unmount: Disconnect and cleanup
- AuctionId change: Reconnect to new auction

---

## Component Integration

### File: `src/pages/AuctionDetailPage.tsx`

#### Part 1: Imports & Setup

```typescript
import { useAuctionWebsocket } from "../hooks/useAuctionWebsocket";
import { BidUpdateMessage, UserRole } from "../api/types";

const { isConnected, isReconnecting } = useAuctionWebsocket({
  auctionId: auctionId || 0,
  onBidUpdate: (message: BidUpdateMessage) => { /* ... */ },
  onTimeExtended: (newEndTime: string) => { /* ... */ },
  onConnect: () => { /* ... */ },
  onDisconnect: () => { /* ... */ },
});
```

#### Part 2: State Updates

```typescript
onBidUpdate: (message: BidUpdateMessage) => {
  if (auction?.id === message.auctionId) {
    setAuction((prev) =>
      prev
        ? {
            ...prev,
            currentPrice: message.currentPrice,
            highestBidder: {
              id: message.highestBidderId,
              name: message.highestBidderName,
              email: "",
              role: UserRole.USER,
            },
          }
        : null
    );
  }
},
onTimeExtended: (newEndTime: string) => {
  setHasTimeExtension(true);
  setAuction((prev) =>
    prev
      ? {
          ...prev,
          endTime: newEndTime,
        }
      : null
  );
  setTimeout(() => setHasTimeExtension(false), 3000);
},
```

**Logic**:
- Update price on bid update
- Update endTime on extension
- Highest bidder object creation from message
- 3-second animation flag for extension badge

#### Part 3: Button Logic

```typescript
const isBidDisabled =
  bidLoading ||              // API call in progress
  !isConnected ||            // No WebSocket connection
  isReconnecting ||          // Currently reconnecting
  isCountdownFinished ||     // Auction ended
  !isAuthenticated ||        // User not logged in
  !isLive;                   // Auction not live

<Button
  disabled={isBidDisabled}
  style={{
    background: isBidDisabled
      ? "linear-gradient(135deg, #6B7280 0%, #4B5563 50%)"  // Gray
      : "linear-gradient(135deg, #FFD700 0%, #FF8C00 50%)", // Gold
    border: "none",
    fontWeight: "bold",
    color: isBidDisabled ? "#9CA3AF" : "#000",
  }}
>
  Place Bid
</Button>
```

**UI States**:
- Enabled (gold gradient): Ready to bid
- Disabled (gray gradient): Cannot bid
- Loading animation: API call in progress

#### Part 4: Bid Submission

```typescript
const handlePlaceBid = async () => {
  // 1. Check authentication
  if (!isAuthenticated) {
    setShowLoginModal(true);
    return;
  }

  // 2. Check connection
  if (!isConnected || isReconnecting) {
    message.error("Waiting for real-time connection. Please try again.");
    return;
  }

  // 3. Validate amount
  const bidAmountNum = parseFloat(bidAmount);
  if (!bidAmount || isNaN(bidAmountNum)) {
    message.error("Please enter a valid bid amount");
    return;
  }
  if (bidAmountNum < minimumBid) {
    message.error(`Minimum bid is $${minimumBid.toFixed(2)}`);
    return;
  }

  // 4. Submit bid
  setBidLoading(true);
  try {
    const bidderId = user?.id ? Number(user.id) : 0;
    if (!bidderId) {
      message.error("User information not available");
      return;
    }

    const response = await auctionApi.placeBid(auction.id, bidderId, bidAmountNum);
    
    if (response.success) {
      setBidAmount("");
      message.success(response.message || "Bid placed successfully!");
      // WebSocket updates UI automatically
    } else {
      message.error(response.message || "Failed to place bid");
    }
  } catch (error) {
    // Error notification shown
  } finally {
    setBidLoading(false);
  }
};
```

**Flow**:
1. Authentication check
2. Connection validation (prevents stale bids)
3. Amount validation
4. API submission with user ID
5. Success/error handling
6. UI updated via WebSocket callback

#### Part 5: UI Components

**Connection Status Indicator**:
```typescript
{isReconnecting ? (
  <Tooltip title="Reconnecting to real-time updates...">
    <span className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded-full text-yellow-400 text-sm">
      <span className="animate-spin">⟳</span>
      Reconnecting...
    </span>
  </Tooltip>
) : isConnected ? (
  <Tooltip title="Real-time updates connected">
    <span className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700/50 rounded-full text-green-400 text-sm">
      <WifiOutlined className="text-xs" />
      Connected
    </span>
  </Tooltip>
) : (
  <Tooltip title="Disconnected - attempting to reconnect">
    <span className="flex items-center gap-2 px-3 py-1 bg-red-900/30 border border-red-700/50 rounded-full text-red-400 text-sm">
      <DisconnectOutlined className="text-xs" />
      Disconnected
    </span>
  </Tooltip>
)}
```

**Time Extension Badge**:
```typescript
{hasTimeExtension && (
  <Tag
    color="gold"
    className="text-base px-3 py-1 animate-pulse"
  >
    ⏱ Time Extended!
  </Tag>
)}
```

**Connection Warnings**:
```typescript
{!isConnected && !isReconnecting && (
  <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded text-red-400 text-sm">
    Real-time connection lost. Bidding is temporarily unavailable.
  </div>
)}

{isReconnecting && (
  <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400 text-sm">
    Connecting to real-time updates... Please wait.
  </div>
)}
```

---

## Type System

### File: `src/api/types.ts`

```typescript
// Response type for successful bid placement
export interface PlaceBidResponse {
  success: boolean;              // Bid was accepted
  message: string;               // User-friendly message
  currentPrice: number;          // Updated auction price
  highestBidderId: number;       // ID of highest bidder
  highestBidderName: string;     // Display name of highest bidder
  timestamp: string;             // ISO 8601 timestamp
  extended: boolean;             // Time was extended due to anti-snipe
}

// Message received from WebSocket for real-time updates
export interface BidUpdateMessage {
  auctionId: number;             // Which auction
  currentPrice: number;          // New current price
  highestBidderId: number;       // ID of highest bidder
  highestBidderName: string;     // Display name
  bidCount: number;              // Total bids placed
  extended: boolean;             // Time was extended
  timestamp: string;             // When bid was placed
  newEndTime?: string;           // New end time if extended
}
```

**Type Safety Benefits**:
- Compile-time checking for message structure
- IDE autocomplete for all fields
- Prevents runtime errors from missing fields
- Self-documenting code

---

## Communication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Component Lifecycle                          │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ↓
                    ┌──────────────────────┐
                    │  useAuctionWebsocket │
                    │  Hook Initializes    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                ↓                             ↓
        ┌─────────────────┐          ┌────────────────┐
        │  STOMP Connect  │          │  State Updates │
        │  /topic/auction │          │  isConnected   │
        │  /{auctionId}   │          │  isReconnecting│
        └────────┬────────┘          └────────────────┘
                 │
         ┌───────┴────────┐
         ↓                ↓
    SUCCESS            ERROR
         │                │
    ┌────┴────┐      ┌────┴──────┐
    ↓         ↓      ↓           ↓
   GREEN  SUBSCRIBE RED      SCHEDULE
   (✓)  /topic/...(✗) RECONNECT
         │               5s
         ↓               │
    ┌──────────────┐     └────→ RETRY
    │ Heartbeat    │            AGAIN
    │ 10s Interval │            (loop)
    └──────────────┘
         │
    ┌────┴─────────┐
    ↓              ↓
  ALIVE        DEAD/TIMEOUT
    │              │
    ↓              ↓
  KEEP        CALL handleDisconnect
  GOING       │
              └──→ Schedule Reconnect
                   │
                   ↓
              (Retry Loop)

┌─────────────────────────────────────────────────────────────────────┐
│                      WebSocket Message Flow                          │
└─────────────────────────────────────────────────────────────────────┘

Message from /topic/auction/{id}
    │
    ↓
┌───────────────────────────────┐
│ handleBidUpdate               │
│ - Parse BidUpdateMessage      │
│ - Call onBidUpdate callback   │
└───────────┬───────────────────┘
            │
    ┌───────┴───────┐
    ↓               ↓
onBidUpdate      Check Extended
    │                │
    ↓                ├─ true → onTimeExtended
Update              │         Show Gold Alert
Local State         └─ false → Skip
    │
    ↓
Show Notification:
"{Name} đã đặt giá ${price}!"
    │
    ↓
Component Re-renders with:
- New currentPrice
- New highestBidder
- New endTime (if extended)
- Extension badge (if extended)
```

---

## Summary

### Key Algorithms

1. **Connection Management**: Detect → Notify → Retry → Sync
2. **Heartbeat Monitoring**: Regular pings detect dead connections
3. **Reconnection**: Exponential backoff (5s intervals)
4. **Cache Sync**: Invalidate + Refetch on successful reconnect
5. **Time Extension**: Parse message → Update state → Animate badge

### Critical Code Sections

| Section | File | Lines | Purpose |
|---------|------|-------|---------|
| Heartbeat Setup | useAuctionWebsocket | 100 | Detects broken connections |
| Reconnection | useAuctionWebsocket | 65 | Auto-recovery from network loss |
| Cache Invalidation | useAuctionWebsocket | 120 | State sync after reconnect |
| Button Guard | AuctionDetailPage | 180 | Prevents stale bids |
| Bid Submission | AuctionDetailPage | 200 | Full validation + API call |

---

**Created**: January 25, 2026  
**Status**: ✅ Production Ready  
**Test Coverage**: Ready for integration testing

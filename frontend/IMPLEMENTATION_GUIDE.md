# Key Implementation Files Summary

## 1. package.json
**Location:** Root
**Key Dependencies Added:**
- React 19, Vite 7
- Ant Design 6, Tailwind CSS 3
- Zustand 5, TanStack Query 5
- Axios 1.13, @stomp/stompjs 7
- React Router DOM 6, @react-oauth/google 0.12

## 2. src/types/index.ts
**Location:** `src/types/index.ts`
**Purpose:** Central TypeScript definitions
**Key Exports:**
- `AuctionStatus` enum (DRAFT, SCHEDULED, LIVE, ENDED, SETTLED, CANCELLED)
- `AuctionItem` interface - Full auction data structure
- `BidRequest`, `BidResponse` - Bidding types
- `ExchangeTokenResponse` - Auth token response
- `PricePingEvent` - Real-time price update event

## 3. src/api/axiosClient.ts
**Location:** `src/api/axiosClient.ts`
**Purpose:** HTTP client with auto token refresh
**Key Features:**
- Request interceptor: Adds `Authorization: Bearer {token}`
- Response interceptor: 
  - Auto-refresh on 401 error
  - Queues failed requests during refresh
  - Retries original request with new token
  - Logs out on refresh failure

**Usage:**
```typescript
import axiosClient from 'src/api/axiosClient';
const response = await axiosClient.get('/auctions');
```

## 4. src/api/auctionApi.ts
**Location:** `src/api/auctionApi.ts`
**Purpose:** Auction business logic API layer
**Mock Features:**
- Generates realistic mock auction data
- Simulates 300-500ms network latency
- Tests LIVE tab special logic (< 1 hour startTime)

**Key Functions:**
- `getAllAuctions()` - Returns 8 mock auctions
- `getAuctionById(id)` - Single auction lookup
- `placeBid(request)` - Validates and places bid
- `getBidHistory(auctionId)` - Returns bid list

**Data States:**
- 2 LIVE auctions (happening now)
- 2 UPCOMING < 1h (starting soon)
- 2 UPCOMING > 1h (future)
- 2 ENDED (completed)

## 5. src/store/useAuthStore.ts
**Location:** `src/store/useAuthStore.ts`
**Purpose:** Persistent auth state management
**State:**
- `accessToken`: JWT token
- `refreshToken`: Refresh token
- `user`: User profile data
- `isAuthenticated`: Boolean flag

**Methods:**
- `setTokens(access, refresh)` - Store tokens
- `setUser(user)` - Store user profile
- `logout()` - Clear all auth data

**Persistence:** 
- Auto-saves to localStorage under "auth-store" key
- Restores on app reload

**Usage:**
```typescript
const { user, isAuthenticated, logout } = useAuthStore();
```

## 6. src/hooks/useAuth.ts
**Location:** `src/hooks/useAuth.ts`
**Purpose:** Authentication business logic
**Key Functions:**
- `login(code)` - Exchange Google code for tokens
- `logout()` - Logout and clear state

**Flow:**
```
User clicks Login
  ↓
Google returns code
  ↓
login(code) calls authApi.exchangeToken()
  ↓
Mock returns tokens + user profile
  ↓
setTokens() + setUser() in store
  ↓
Header updates with user info
```

## 7. src/hooks/useWebSocket.ts
**Location:** `src/hooks/useWebSocket.ts`
**Purpose:** Real-time price updates via STOMP
**Features:**
- Connects to Spring Boot WebSocket
- Subscribes to `/topic/auctions` (price updates)
- Subscribes to `/user/queue/notifications` (personal)
- Auto-reconnect with 5s delay
- Heartbeat every 4 seconds

**Usage:**
```typescript
const { isConnected, subscribe, publish } = useWebSocket({
  onPriceUpdate: (event) => setPrice(event.currentPrice),
  onConnect: () => console.log('WS connected'),
  onError: (err) => console.error(err)
});
```

**Subscribe Format:**
```typescript
subscribe('/topic/auctions', (message) => {
  const data = JSON.parse(message.body);
  console.log('Price update:', data);
});
```

## 8. src/components/layout/Header.tsx
**Location:** `src/components/layout/Header.tsx`
**Purpose:** Top navigation and authentication UI
**Features:**
- **Guest State:**
  - Shows "Login with Google" button
  - Calls `GoogleLoginButton` component
  
- **Authenticated State:**
  - Shows user avatar
  - Shows user name + email
  - Dropdown menu with:
    - Admin Dashboard (if role = ADMIN)
    - Logout option
  
- **Styling:** Dark background (gray-900) with Ant Design Avatar

## 9. src/features/auction/Countdown.tsx
**Location:** `src/features/auction/Countdown.tsx`
**Purpose:** Countdown timer for auctions
**Features:**
- Live countdown in HH:MM:SS format
- Updates every 1 second
- Warning color (red) when < 1 minute
- Status tags: "Ended", "Live", "Starts in"

**Props:**
- `endTime: string` - ISO 8601 datetime
- `onEnded?: () => void` - Callback when timer ends
- `isLive?: boolean` - Show "Ends in" vs "Starts in"

**Algorithm:**
```
Calculate difference: endTime - now
If <= 0: Show "Ended"
If < 60s: Show red warning
If < 1 hour: Show orange
Else: Show green/blue
```

## 10. src/features/auction/AuctionCard.tsx
**Location:** `src/features/auction/AuctionCard.tsx`
**Purpose:** Individual auction display and bidding
**Features:**
- Image display with fallback
- Status badge (LIVE, UPCOMING, ENDED)
- Price display (starting + current)
- Seller name
- Real-time price updates
- Bid input with validation
- Countdown timer
- Min bid calculation: `currentPrice + minStep`

**Props:**
- `auction: AuctionItem` - Auction data
- `onBidSuccess?: () => void` - Callback after bid

**Bid Validation:**
```
1. Parse user input
2. Check if amount is number
3. Check if amount >= currentPrice + minStep
4. If valid: Call auctionApi.placeBid()
5. On success: Update local price, show message
6. On error: Show error message
```

## 11. src/features/auction/AuctionList.tsx
**Location:** `src/features/auction/AuctionList.tsx`
**Purpose:** Grid layout for multiple auction cards
**Features:**
- Responsive grid (xs=24, sm=12, md=8, lg=6 columns)
- Loading spinner
- Empty state message
- Grid gutter: 16px

**Props:**
- `auctions: AuctionItem[]`
- `loading: boolean`
- `emptyMessage?: string`

## 12. src/pages/HomePage.tsx
**Location:** `src/pages/HomePage.tsx`
**Purpose:** Main auction dashboard
**Key Logic:**
```
const getLiveAuctions = () => {
  FILTER: status === 'LIVE' 
  OR status === 'SCHEDULED' AND (startTime - now) < 1 hour
}

const getUpcomingAuctions = () => {
  FILTER: status === 'SCHEDULED' AND (startTime - now) >= 1 hour
}

const getEndedAuctions = () => {
  FILTER: status === 'ENDED' OR 'SETTLED'
}
```

**Tabs:**
1. LIVE (with count)
2. UPCOMING (with count)
3. ENDED (with count)

**Real-time Integration:**
- `useWebSocket()` hook listens for price updates
- Updates auction state when prices change
- Shows connection status badge

## 13. src/pages/AdminDashboard.tsx
**Location:** `src/pages/AdminDashboard.tsx`
**Purpose:** Admin panel (placeholder)
**Features:**
- Protected route (requires ADMIN role)
- Placeholder for future admin features
- Returns 404 if not admin

## 14. src/auth/ProtectedRoute.tsx
**Location:** `src/auth/ProtectedRoute.tsx`
**Purpose:** Route protection wrapper
**Logic:**
```
If not authenticated: Redirect to /
If requiredRole set and user.role !== requiredRole: Redirect to /
Else: Render children
```

**Usage:**
```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## 15. src/auth/GoogleLoginButton.tsx
**Location:** `src/auth/GoogleLoginButton.tsx`
**Purpose:** Google OAuth login button
**Current:** Mock implementation with simulated code
**TODO:** Replace with real @react-oauth/google integration

## 16. App.jsx
**Location:** `src/App.jsx`
**Purpose:** Root component and router
**Structure:**
```
<ConfigProvider theme={darkAlgorithm}>
  <Router>
    <Layout>
      <Header />
      <Content>
        <Routes>
          / → <HomePage />
          /admin → <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          * → <NotFound />
        </Routes>
      </Content>
      <Footer />
    </Layout>
  </Router>
</ConfigProvider>
```

## 17. Configuration Files

### tailwind.config.js
- Custom colors (primary, success, warning, error)
- Border radius: 8px
- Important: true (override Ant Design)
- Disable preflight (Ant Design handles reset)

### postcss.config.js
- Tailwind CSS plugin
- Autoprefixer for vendor prefixes

### vite.config.js (default)
- React plugin
- Port 5173
- HMR enabled

## 18. Global Styles

### src/index.css
- Tailwind directives (base, components, utilities)
- HTML/body height 100%
- Ant Design overrides
- Custom animations (fadeIn)
- Tab styling

### src/App.css
- App-specific overrides

## Data Flow Diagram

```
User → Header → GoogleLoginButton
       ↓
    useAuth hook
       ↓
    authApi.exchangeToken()
       ↓
    Mock returns tokens
       ↓
    useAuthStore.setTokens()
    useAuthStore.setUser()
       ↓
    Header re-renders with user info
    Axios interceptor includes token

---

User Views HomePage
       ↓
    Fetches auctions: auctionApi.getAllAuctions()
       ↓
    useWebSocket connects to /topic/auctions
       ↓
    WebSocket listens for price updates
       ↓
    Renders 3 tab views with AuctionList
       ↓
    Each AuctionCard displays bid input
       ↓
    User places bid → auctionApi.placeBid()
       ↓
    Backend processes → emits via WebSocket
       ↓
    Countdown timer updates real-time
       ↓
    Price updates via onPriceUpdate callback
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **View production build:**
   ```bash
   npm run preview
   ```

## Next Integration Steps

1. Install `@react-oauth/google`
2. Add `<GoogleOAuthProvider>` wrapper in main.jsx
3. Replace mock `GoogleLoginButton` with real component
4. Point `VITE_API_URL` to actual backend
5. Test token endpoints
6. Configure WebSocket endpoint
7. Test real auction data
8. Implement Admin Dashboard features

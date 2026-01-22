# Real-time Auction & Bidding Platform - Frontend

A modern React-based frontend for a real-time auction and bidding platform with anti-fraud control mechanisms.

## Technology Stack

### Core
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety

### UI & Styling
- **Ant Design (antd)** - Component library with dark mode support
- **Tailwind CSS** - Utility-first CSS framework
- **Ant Design Dark Algorithm** - Pre-configured dark theme

### State Management
- **Zustand** - Lightweight global state management
  - Auth store (`useAuthStore`) - User authentication & tokens
  - UI store (`useUIStore`) - Theme and UI settings
- **TanStack Query (React Query)** - Server state management & caching

### Real-time Communication
- **@stomp/stompjs** - WebSocket client for real-time updates
- **sockjs-client** - WebSocket fallback support

### HTTP & API
- **Axios** - HTTP client with interceptors
  - Auto token refresh on 401
  - Request/response interceptors
  - Mock API for development

### Authentication
- **@react-oauth/google** - Google OAuth integration
- **jwt-decode** - JWT token parsing
- **React Router DOM** - Client-side routing

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API layer
│   │   ├── axiosClient.ts      # Axios instance with interceptors
│   │   ├── auctionApi.ts       # Auction API (mock & real)
│   │   └── authApi.ts          # Authentication API
│   ├── auth/                   # Authentication components
│   │   ├── GoogleLoginButton.tsx
│   │   └── ProtectedRoute.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx      # App header with user menu
│   │   │   └── Footer.tsx      # App footer
│   │   └── ui/                 # Reusable UI components
│   ├── features/auction/       # Auction-specific components
│   │   ├── Countdown.tsx       # Auction countdown timer
│   │   ├── AuctionCard.tsx     # Individual auction card
│   │   └── AuctionList.tsx     # Grid of auction cards
│   ├── hooks/                  # Custom React hooks
│   │   ├── useWebSocket.ts     # WebSocket STOMP client
│   │   └── useAuth.ts          # Authentication logic
│   ├── pages/                  # Page components
│   │   ├── HomePage.tsx        # Main auction dashboard
│   │   ├── AdminDashboard.tsx  # Admin panel (protected)
│   │   └── NotFound.tsx        # 404 page
│   ├── store/                  # Zustand stores
│   │   ├── useAuthStore.ts     # Auth state with persistence
│   │   └── useUIStore.ts       # UI theme state
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── App.jsx                 # Root component with routing
│   ├── main.jsx                # React entry point
│   ├── App.css                 # App styles
│   └── index.css               # Global styles
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
├── .env.example                # Environment variables template
└── .gitignore

```

## Key Features

### 1. Real-time Auction Dashboard
- **Three Tab Views:**
  - **LIVE**: Shows currently active auctions + auctions starting within 1 hour
  - **UPCOMING**: Auctions starting beyond 1 hour
  - **ENDED**: Completed auctions

- **Auction Card Display:**
  - Title, description, and image
  - Start/end times
  - Starting price and current price
  - Minimum bid step
  - Real-time price updates via WebSocket
  - Live countdown timer (ends/starts in)
  - Seller information

### 2. Bidding System
- **Place Bid Input** with validation
  - Minimum bid enforcement (currentPrice + minStep)
  - Input sanitization
  - Real-time feedback

### 3. Real-time Price Updates
- WebSocket STOMP subscription to `/topic/auctions`
- Live price updates without page refresh
- Simulated real-time data for development

### 4. Authentication (Google OAuth)
- **Login Flow:**
  1. User clicks "Login with Google"
  2. Gets authorization code
  3. Frontend sends code to backend: `POST /api/auth/token`
  4. Backend returns JWT tokens
  5. Tokens stored in localStorage via Zustand
  
- **Token Management:**
  - Access token attached to all requests via Axios interceptor
  - Auto-refresh on 401 error
  - Graceful logout on refresh failure

- **Header Integration:**
  - Show "Login with Google" for guests
  - Show user avatar, name, and dropdown menu when logged in
  - Admin dashboard link (if user is ADMIN)

### 5. Protected Routes
- `/admin` - Admin Dashboard (requires ADMIN role)
- Automatic redirect to home for unauthorized access

### 6. Dark Mode
- Enabled by default
- Ant Design dark algorithm pre-configured
- Tailwind dark mode support
- Persistent theme preference in Zustand

## API Integration

### Mock API (Development)
Mock implementations with 300-500ms delays to simulate network latency:
- `auctionApi.getAllAuctions()`
- `auctionApi.getAuctionById(auctionId)`
- `auctionApi.placeBid(request)`
- `authApi.exchangeToken(code)`
- `authApi.refreshToken(token)`

### Real API (Backend Ready)
Switch to real API by importing from `*Real` exports:
- `auctionApiReal.getAllAuctions()`
- `authApiReal.exchangeToken()`

## Environment Configuration

Create `.env.local` file:
```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_APP_ENV=development
```

## Development

### Start Development Server
```bash
npm run dev
```
Runs on `http://localhost:5173` with hot module reload

### Build for Production
```bash
npm run build
```
Output in `dist/` folder

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## Mock Data

The system generates realistic mock auction data:

**LIVE Auctions:**
- Vintage Camera Collection - $450 current price
- Signed First Edition Books - $320 current price

**UPCOMING (< 1 hour):**
- Gaming Console Bundle - Starting in 15 minutes
- Smartphone Auction - Starting in 15 minutes

**UPCOMING (> 1 hour):**
- Designer Handbag - Starting in 2 hours
- Mountain Bike - Starting in 2 hours

**ENDED Auctions:**
- Original Vinyl Records - Final price $280
- Antique Watch - Final price $1200

## Type Definitions

```typescript
interface AuctionItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  startPrice: number;
  currentPrice: number;
  minStep: number;
  status: AuctionStatus;
  sellerId: string;
  sellerName: string;
  imageUrl?: string;
  highestBidderId?: string;
  highestBidderName?: string;
}

interface BidRequest {
  auctionId: string;
  bidAmount: number;
}

interface ExchangeTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'USER' | 'ADMIN';
  };
}
```

## Advanced Features

### WebSocket Hook
```typescript
const { isConnected, subscribe, publish } = useWebSocket({
  onPriceUpdate: (event) => { /* Handle price update */ },
  onConnect: () => { /* Handle connect */ },
  onDisconnect: () => { /* Handle disconnect */ },
  onError: (error) => { /* Handle error */ },
});
```

### Auth Hook
```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

### Axios Interceptors
- Request: Attaches `Authorization: Bearer {token}`
- Response: Auto-refreshes token on 401 error
- Handles token refresh queue to prevent race conditions

## Browser Support

- Modern browsers with ES6+ support
- WebSocket support required for real-time features
- LocalStorage for token persistence

## Performance Optimizations

- **Code Splitting:** Components lazy-loaded via React Router
- **CSS-in-JS:** Tailwind purges unused styles in production
- **Bundle Size:** ~60KB gzipped
- **Caching:** Zustand persists auth state across sessions
- **Memoization:** React Query caches server state

## Next Steps / Integration Points

1. **Google OAuth Configuration**
   - Install `@react-oauth/google`
   - Wrap app in `GoogleOAuthProvider`
   - Integrate actual Google Sign-In button

2. **Backend Integration**
   - Point `VITE_API_URL` to actual backend
   - Configure WebSocket endpoint
   - Switch to `*Real` API implementations

3. **Admin Dashboard**
   - Add auction management features
   - Add fraud detection visualizations
   - Add user management interface

4. **Auction Detail Page**
   - Create `/auction/:id` route
   - Display full bid history
   - Show auction timeline

5. **User Profile**
   - User auction history
   - Bid tracking
   - Account settings

## Dependencies Overview

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.0 | UI framework |
| vite | 7.2.4 | Build tool |
| antd | 6.2.1 | UI components |
| tailwindcss | 3.4.1 | CSS framework |
| zustand | 5.0.10 | State management |
| axios | 1.13.2 | HTTP client |
| @tanstack/react-query | 5.90.19 | Server state |
| @stomp/stompjs | 7.2.1 | WebSocket STOMP |
| react-router-dom | 6.22.0 | Routing |
| @react-oauth/google | 0.12.1 | Google OAuth |
| dayjs | 1.11.19 | Date formatting |

## Troubleshooting

### WebSocket Connection Issues
- Check if backend is running on correct port
- Verify `VITE_WS_URL` environment variable
- Check browser console for STOMP errors

### Token Refresh Loop
- Ensure backend `/auth/refresh` endpoint exists
- Check token expiration configuration
- Verify refresh token validity

### Build Errors
- Clear `node_modules` and reinstall: `rm -r node_modules && npm install`
- Clear Vite cache: `rm -r .vite`

## License

This project is part of the Real-time Auction & Bidding Platform system.

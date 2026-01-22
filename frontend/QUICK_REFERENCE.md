# Frontend Development Quick Reference

## File Locations & Purposes

### API Layer (`src/api/`)
| File | Purpose |
|------|---------|
| `axiosClient.ts` | Axios instance with auth interceptors, token refresh logic |
| `auctionApi.ts` | Mock/real auction endpoints (fetch, bid, history) |
| `authApi.ts` | Mock/real auth endpoints (login, refresh, logout) |

### State Management (`src/store/`)
| Store | State | Persistence |
|-------|-------|-------------|
| `useAuthStore` | user, tokens, isAuthenticated | localStorage |
| `useUIStore` | darkMode, sidebarCollapsed | memory |

### React Hooks (`src/hooks/`)
| Hook | Returns | Purpose |
|------|---------|---------|
| `useAuth` | {user, isAuthenticated, login, logout} | Auth logic |
| `useWebSocket` | {isConnected, subscribe, publish} | STOMP client |

### Components (`src/components/` & `src/features/`)
| Component | File | Props |
|-----------|------|-------|
| `Header` | `layout/Header.tsx` | none (uses stores/hooks) |
| `Footer` | `layout/Footer.tsx` | none |
| `AuctionCard` | `features/auction/AuctionCard.tsx` | `auction: AuctionItem` |
| `AuctionList` | `features/auction/AuctionList.tsx` | `auctions[], loading, message` |
| `Countdown` | `features/auction/Countdown.tsx` | `endTime, onEnded?, isLive?` |

### Pages (`src/pages/`)
| Page | Route | Protected | Purpose |
|------|-------|-----------|---------|
| `HomePage` | `/` | No | Main auction dashboard |
| `AdminDashboard` | `/admin` | Yes (ADMIN) | Admin panel |
| `NotFound` | `/*` | No | 404 handler |

## Common Tasks

### Add a New Auction Feature
```typescript
// 1. Add to types/index.ts
export interface MyFeature {
  // ...
}

// 2. Create component in features/auction/MyComponent.tsx
// 3. Import and use in HomePage.tsx

// 4. If needs API, add to api/auctionApi.ts
export const auctionApi = {
  myFeature: async () => { /* mock or real */ }
}

// 5. Use in component
const data = await auctionApi.myFeature();
```

### Add a New Page
```typescript
// 1. Create file in src/pages/MyPage.tsx
export const MyPage = () => { /* JSX */ };

// 2. Add route in App.jsx
<Route path="/mypage" element={<MyPage />} />

// 3. Link from Header or other component
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/mypage');
```

### Add Protected Route (ADMIN only)
```typescript
// In App.jsx
<Route
  path="/admin/special"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <SpecialAdminPage />
    </ProtectedRoute>
  }
/>
```

### Display Real-time Price Updates
```typescript
// In your component
const { onPriceUpdate } = useWebSocket({
  onPriceUpdate: (event: PricePingEvent) => {
    console.log(`Auction ${event.auctionId}: $${event.currentPrice}`);
    // Update UI state
  }
});
```

### Store User Data Persistently
```typescript
// Use Zustand store (auto-persisted to localStorage)
import { useAuthStore } from 'src/store/useAuthStore';

const { user, setUser } = useAuthStore();
```

### Fetch Data with Error Handling
```typescript
import { useQuery } from '@tanstack/react-query';
import { auctionApi } from 'src/api/auctionApi';

const { data, isLoading, error } = useQuery({
  queryKey: ['auctions'],
  queryFn: auctionApi.getAllAuctions,
});
```

## Environment Variables

Create `.env.local`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
VITE_GOOGLE_CLIENT_ID=your_id
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Debugging

### Enable API Request Logging
```typescript
// In axiosClient.ts, uncomment response interceptor logs
console.log('Request:', config);
```

### WebSocket Debugging
```typescript
// STOMP client has built-in debug logging
// Check browser console for STOMP: messages
```

### Redux DevTools (if using Redux)
Not currently in use, but Zustand state is visible in browser console:
```javascript
// Browser console
useAuthStore.getState() // View current auth state
```

## Performance Tips

1. **Memoize Components:**
   ```typescript
   const AuctionCard = memo(({ auction }) => { /* ... */ });
   ```

2. **Use React Query Caching:**
   - Data automatically cached by `queryKey`
   - Revalidate with `refetch()` or time-based invalidation

3. **Lazy Load Routes:**
   ```typescript
   const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
   <Suspense fallback={<Spin />}>
     <AdminDashboard />
   </Suspense>
   ```

4. **Optimize Images:**
   - Use `next-gen` formats
   - Lazy load with Intersection Observer

## Testing

### Unit Test Example
```typescript
// __tests__/Countdown.test.tsx
import { render, screen } from '@testing-library/react';
import { Countdown } from 'src/features/auction/Countdown';

test('shows countdown', () => {
  render(<Countdown endTime={futureTime} />);
  expect(screen.getByText(/ends in/i)).toBeInTheDocument();
});
```

Run tests:
```bash
npm run test
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
```bash
npm run build
# Deploy the dist/ folder
```

## Backend Integration Checklist

- [ ] Point `VITE_API_URL` to backend
- [ ] Configure `VITE_WS_URL` for WebSocket
- [ ] Test `/api/auth/token` endpoint
- [ ] Test `/api/auth/refresh` endpoint
- [ ] Test WebSocket `/topic/auctions` subscription
- [ ] Configure Google OAuth credentials
- [ ] Test real auction data fetching
- [ ] Test real-time price updates
- [ ] Test token auto-refresh

## Useful Links

- [React Documentation](https://react.dev)
- [Ant Design](https://ant.design)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Axios Documentation](https://axios-http.com)
- [STOMP.js Documentation](https://stomp-js.github.io)
- [React Router](https://reactrouter.com)

## Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build           # Build for production
npm run preview        # Preview production build

# Code Quality
npm run lint           # Run ESLint

# Maintenance
npm install            # Install dependencies
npm update             # Update dependencies
npm audit              # Check for vulnerabilities
```

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AppAntd, ConfigProvider, theme } from 'antd';
import NProgress from 'nprogress';
import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigationType } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './auth/ProtectedRoute';
import { AntdStaticSetter } from './components/AntdStaticSetter';
import { NavigationProgress } from './components/NavigationProgress';
import { useHeartbeat } from './hooks/useHeartbeat';
import AdminLayout from './layouts/AdminLayout';
import MainLayout from './layouts/MainLayout';
import SellerLayout from './layouts/SellerLayout';
import { SpeedInsights } from "@vercel/speed-insights/react";

const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const BidsPage = lazy(() => import('./pages/account/BidsPage'));
const BidStatisticsPage = lazy(() => import('./pages/account/BidStatisticsPage'));
const IdentityVerificationPage = lazy(() => import('./pages/account/IdentityVerificationPage'));
const NotificationsPage = lazy(() => import('./pages/account/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'));
const SecurityLogsPage = lazy(() => import('./pages/account/SecurityLogsPage'));
const SellerRegPage = lazy(() => import('./pages/account/SellerRegPage'));
const WishlistPage = lazy(() => import('./pages/account/WishlistPage'));

const AdminAuctionPage = lazy(() => import('./pages/admin/AdminAuctionPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminNotificationPage = lazy(() => import('./pages/admin/AdminNotificationPage'));
const AdminUserPage = lazy(() => import('./pages/admin/AdminUserPage'));
const AILogsPage = lazy(() => import('./pages/admin/AILogsPage'));
const AuctionReviewPage = lazy(() => import('./pages/admin/AuctionReviewPage'));
const AdminHeroSlidePage = lazy(() => import('./pages/admin/AdminHeroSlidePage'));
const ContactManagementPage = lazy(() => import('./pages/admin/ContactManagementPage'));
const SellerManagementPage = lazy(() => import('./pages/admin/SellerManagementPage'));

const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const AuctionDetailPage = lazy(() => import('./pages/home/AuctionDetailPage'));
const AuctionsPage = lazy(() => import('./pages/home/AuctionsPage'));
const HomePage = lazy(() => import('./pages/home/HomePage'));
const ParticipatedAuctionsPage = lazy(() => import('./pages/home/ParticipatedAuctionsPage'));
const SellersPage = lazy(() => import('./pages/home/SellersPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const SellerAuctionPage = lazy(() => import('./pages/seller/SellerAuctionPage'));
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const SellerNotificationPage = lazy(() => import('./pages/seller/SellerNotificationPage'));

const PageLoader = () => {
  useEffect(() => {
    NProgress.start();
    return () => { NProgress.done(); };
  }, []);
  return null;
};

// Prefetch public routes in background after initial load — eliminates spinner on first navigation
const prefetchPublicRoutes = () => {
  import('./pages/home/AuctionsPage');
  import('./pages/home/AuctionDetailPage');
  import('./pages/home/SellersPage');
  import('./pages/home/ParticipatedAuctionsPage');
};

// Create a client for React Query
const queryClient = new QueryClient();

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Chỉ cuộn lên top nếu là navigate mới (PUSH hoặc REPLACE).
    // Nếu là back (POP), trình duyệt sẽ tự khôi phục vị trí scroll cũ.
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);

  return null;
};

function App() {
  // Mount once globally — writes Kafka health to useUIStore
  // All components read isKafkaAlive from useUIStore, no extra connections
  useHeartbeat();

  useEffect(() => {
    prefetchPublicRoutes();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorBgLayout: '#191B24',
            colorBgContainer: '#21242E',
            colorBgElevated: '#2A2D3A',
            colorText: '#FFFFFF',
            colorTextHeading: '#FFFFFF',
            colorTextDescription: 'rgba(255, 255, 255, 0.65)',
            borderRadius: 12,
            lineWidth: 0,
            colorPrimary: '#FED469',
            colorBorder: 'rgba(255,255,255,0.1)',
            colorTextSecondary: 'rgba(255,255,255,0.6)',
            colorSuccess: '#10B981',
            colorWarning: '#FED469',
            colorError: '#F43F5E',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
          components: {
            Message: {
              colorBgElevated: '#2A2D3A',
              colorText: '#FFFFFF',
              boxShadowSecondary: '0 15px 50px rgba(0,0,0,0.8)',
            },
            Notification: {
              colorBgElevated: '#2A2D3A',
              colorText: 'rgba(255, 255, 255, 0.65)',
              colorTextHeading: '#FFFFFF',
              boxShadowSecondary: '0 15px 50px rgba(0,0,0,0.8)',
            },
            Button: {
              colorPrimary: 'linear-gradient(to right, #FED469, #FEECBB)',
              colorPrimaryHover: 'linear-gradient(to right, #FEECBB, #FED469)',
              colorPrimaryActive: '#FED469',
              colorTextLightSolid: '#191B24',
            },
            Input: {
              colorBgContainer: '#121212',
              colorPrimaryHover: '#FED469',
              colorPrimary: '#FED469',
              activeBorderColor: '#FED469',
            },
            Modal: {
              headerBg: '#2A2D3A',
              contentBg: '#2A2D3A',
              footerBg: '#2A2D3A',
            },
            Tooltip: {
              colorBgDefault: '#2A2D3A',
            },
          },
        }}
      >
        <AppAntd>
          <AntdStaticSetter />
          <Router>
            <ScrollToTop />
            <NavigationProgress />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes with MainLayout (Header + Footer) */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/auctions" element={<AuctionsPage />} />
                <Route path="/auction/:id" element={<AuctionDetailPage />} />
                <Route path="/participated" element={<ParticipatedAuctionsPage />} />
                <Route path="/sellers" element={<SellersPage />} />
                <Route
                  path="/my-bids"
                  element={<Navigate to="/account/bids" replace />}
                />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
              </Route>

              {/* Admin Routes with AdminLayout (Sidebar + Admin Header) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUserPage />} />
                <Route path="auctions" element={<AdminAuctionPage />} />
                <Route path="auction-review" element={<AuctionReviewPage />} />
                <Route path="sellers" element={<SellerManagementPage />} />
                <Route path="contacts" element={<ContactManagementPage />} />
                <Route path="notifications" element={<AdminNotificationPage />} />
                <Route path="ai-logs" element={<AILogsPage />} />
                <Route path="hero-slides" element={<AdminHeroSlidePage />} />
              </Route>

              {/* Seller Routes with SellerLayout (Sidebar + Seller Header) */}
              <Route
                path="/seller"
                element={
                  <ProtectedRoute requiredRole="SELLER">
                    <SellerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SellerDashboard />} />
                <Route path="auctions" element={<SellerAuctionPage />}>
                  <Route path=":id" element={<SellerAuctionPage />} />
                </Route>
                <Route path="notifications" element={<SellerNotificationPage />} />
              </Route>

              {/* User Account Routes */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route element={<AccountLayout />}>
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="bid-stats" element={<BidStatisticsPage />} />
                  <Route path="bids" element={<BidsPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="seller-reg" element={<SellerRegPage />} />
                  <Route path="identity-verification" element={<IdentityVerificationPage />} />
                  <Route path="security-logs" element={<SecurityLogsPage />} />
                </Route>
              </Route>

              {/* Catch-all for not found pages */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </Router>
          <SpeedInsights />
        </AppAntd>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;

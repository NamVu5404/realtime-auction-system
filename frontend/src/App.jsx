import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AppAntd, ConfigProvider, theme } from 'antd';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './auth/ProtectedRoute';
import { AntdStaticSetter } from './components/AntdStaticSetter';
import { useHeartbeat } from './hooks/useHeartbeat';
import AdminLayout from './layouts/AdminLayout';
import MainLayout from './layouts/MainLayout';
import SellerLayout from './layouts/SellerLayout';
import AccountLayout from './pages/account/AccountLayout';
import BidsPage from './pages/account/BidsPage';
import BidStatisticsPage from './pages/account/BidStatisticsPage';
import IdentityVerificationPage from './pages/account/IdentityVerificationPage';
import NotificationsPage from './pages/account/NotificationsPage';
import ProfilePage from './pages/account/ProfilePage';
import SecurityLogsPage from './pages/account/SecurityLogsPage';
import SellerRegPage from './pages/account/SellerRegPage';
import AdminAuctionPage from './pages/admin/AdminAuctionPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNotificationPage from './pages/admin/AdminNotificationPage';
import AdminUserPage from './pages/admin/AdminUserPage';
import ContactManagementPage from './pages/admin/ContactManagementPage';
import SellerManagementPage from './pages/admin/SellerManagementPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AuctionDetailPage from './pages/home/AuctionDetailPage';
import HomePage from './pages/home/HomePage';
import NotFound from './pages/NotFound';
import SellerAuctionPage from './pages/seller/SellerAuctionPage';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerNotificationPage from './pages/seller/SellerNotificationPage';
import { useUIStore } from './store/useUIStore';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  const darkMode = useUIStore((state) => state.darkMode);

  // Mount once globally — writes Kafka health to useUIStore
  // All components read isKafkaAlive from useUIStore, no extra connections
  useHeartbeat();

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
            fontFamily: "'Be Vietnam Pro', Inter, -apple-system, sans-serif",
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
            <Routes>
              {/* Public Routes with MainLayout (Header + Footer) */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/auction/:id" element={<AuctionDetailPage />} />
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
                <Route path="sellers" element={<SellerManagementPage />} />
                <Route path="contacts" element={<ContactManagementPage />} />
                <Route path="notifications" element={<AdminNotificationPage />} />
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
                  <Route path="seller-reg" element={<SellerRegPage />} />
                  <Route path="identity-verification" element={<IdentityVerificationPage />} />
                  <Route path="security-logs" element={<SecurityLogsPage />} />
                </Route>
              </Route>

              {/* Catch-all for not found pages */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AppAntd>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;

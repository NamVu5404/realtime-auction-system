import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AppAntd } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUIStore } from './store/useUIStore';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import MyBidsPage from './pages/MyBidsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserPage from './pages/admin/AdminUserPage';
import AdminAuctionPage from './pages/admin/AdminAuctionPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './auth/ProtectedRoute';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  const darkMode = useUIStore((state) => state.darkMode);

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
              boxShadowSecondary: '0 15px 50px rgba(0,0,0,0.8)',
            },
            Notification: {
              colorBgElevated: '#2A2D3A',
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
          <Router>
            <Routes>
              {/* Public Routes with MainLayout (Header + Footer) */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/auction/:id" element={<AuctionDetailPage />} />
                <Route
                  path="/my-bids"
                  element={
                    <ProtectedRoute>
                      <MyBidsPage />
                    </ProtectedRoute>
                  }
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

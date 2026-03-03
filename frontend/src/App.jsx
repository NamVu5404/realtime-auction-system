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
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
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

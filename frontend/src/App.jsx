import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider, theme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUIStore } from './store/useUIStore';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './auth/ProtectedRoute';
import './App.css';

const { Content } = Layout;

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
        <Router>
          <Layout className="min-h-screen flex flex-col bg-black">
            <Header />
            <Content className="flex-1 bg-black">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auction/:id" element={<AuctionDetailPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Content>
            <Footer />
          </Layout>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useEffect } from 'react';
import { Card, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to home if not an admin
    if (user && user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
      
      <Card>
        <Empty
          description="Admin dashboard features coming soon"
          style={{ padding: '50px 0' }}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;

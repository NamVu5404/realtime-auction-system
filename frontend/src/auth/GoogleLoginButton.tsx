import { Button, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCallback } from 'react';

/**
 * GoogleLoginButton Component
 * 
 * This component handles Google OAuth login flow.
 * In production, integrate @react-oauth/google library.
 * For now, we simulate the flow with mock data.
 */
export const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = useCallback(async () => {
    try {
      // In production, you would use GoogleLogin from @react-oauth/google
      // For mock purposes, we simulate with a code
      const mockCode = 'mock_auth_code_' + Date.now();
      
      await login(mockCode);
      message.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      message.error('Login failed');
      console.error(error);
    }
  }, [login, navigate]);

  return (
    <Button
      type="primary"
      size="large"
      icon={<GoogleOutlined />}
      onClick={handleGoogleLogin}
    >
      Login with Google
    </Button>
  );
};

export default GoogleLoginButton;

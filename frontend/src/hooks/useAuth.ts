import { useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/authApi';
import { ExchangeTokenRequest } from '../types';

export const useAuth = () => {
  const { accessToken, user, isAuthenticated, setTokens, setUser, logout: logoutStore } = useAuthStore();

  const login = useCallback(
    async (code: string) => {
      try {
        const request: ExchangeTokenRequest = { code };
        const response = await authApi.exchangeToken(request);

        setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);

        return response;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    [setTokens, setUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logoutStore();
    }
  }, [logoutStore]);

  return {
    accessToken,
    user,
    isAuthenticated,
    login,
    logout,
  };
};

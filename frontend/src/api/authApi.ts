import axios from 'axios';
import axiosClient from './axiosClient';
import { ExchangeTokenRequest, ExchangeTokenResponse, RefreshTokenRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Mock token response
const generateMockTokenResponse = (code: string): ExchangeTokenResponse => {
  const token = `mock_token_${code.substring(0, 8)}`;
  return {
    accessToken: token,
    refreshToken: `refresh_${token}`,
    expiresIn: 3600,
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/50x50?text=User',
      role: 'USER',
    },
  };
};

export const authApi = {
  // Exchange Google code for tokens
  exchangeToken: (request: ExchangeTokenRequest): Promise<ExchangeTokenResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockTokenResponse(request.code));
      }, 500);
    });
  },

  // Refresh access token
  refreshToken: (request: RefreshTokenRequest): Promise<ExchangeTokenResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockTokenResponse('refreshed'));
      }, 300);
    });
  },

  // Logout
  logout: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 200);
    });
  },
};

// Real API calls (when backend is ready)
export const authApiReal = {
  exchangeToken: (request: ExchangeTokenRequest) =>
    axios.post<ExchangeTokenResponse>(`${API_BASE_URL}/auth/token`, request, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),

  refreshToken: (request: RefreshTokenRequest) =>
    axiosClient.post<ExchangeTokenResponse>(`/auth/refresh`, request),

  logout: () => axiosClient.post('/auth/logout'),
};

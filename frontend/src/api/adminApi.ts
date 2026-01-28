import axiosClient from './axiosClient';
import { ApiResponse, PageResponse, User, Auction, AuctionStatus, UserRole, UserTrackingResponse } from './types';

// Mock data for missing endpoints
export const mockUserHistory = [
  { id: 1, auctionTitle: 'Vintage Car', bidAmount: 15000, time: '2024-01-15T10:30:00Z' },
  { id: 2, auctionTitle: 'Antique Watch', bidAmount: 5000, time: '2024-01-14T14:20:00Z' },
];

export const mockViolations = [
  { id: 1, type: 'Fraudulent Bid', description: 'Multiple accounts detected', time: '2024-01-10T09:00:00Z' },
  { id: 2, type: 'Spam', description: 'Excessive bidding', time: '2024-01-08T16:45:00Z' },
];

export const adminApi = {
  // User Management
  getUsers: async (
    page: number = 1,
    size: number = 20,
    keyword?: string,
    role?: UserRole,
    status?: 'ACTIVE' | 'BLOCKED'
  ): Promise<PageResponse<User>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<User>>>('/users', {
        params: {
          page,
          size,
          keyword,
          role,
          status,
        },
      });
      return response.data.result;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  blockUser: async (userId: number, reason: string): Promise<void> => {
    try {
      await axiosClient.patch(`/users/${userId}/block`, { reason });
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  },

  unblockUser: async (userId: number, reason: string): Promise<void> => {
    try {
      await axiosClient.patch(`/users/${userId}/unblock`, { reason });
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  },

  // Auction Management
  getAuctions: async (
    page: number = 1,
    size: number = 20,
    keyword?: string,
    status?: AuctionStatus,
    startTime?: string,
    endTime?: string
  ): Promise<PageResponse<Auction>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<Auction>>>('/auctions', {
        params: {
          page,
          size,
          ...(keyword && { keyword }),
          ...(status && { status }),
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
        },
      });
      return response.data.result;
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      throw error;
    }
  },

  createAuction: async (auctionData: any): Promise<Auction> => {
    try {
      const response = await axiosClient.post<ApiResponse<Auction>>('/auctions', auctionData);
      return response.data.result;
    } catch (error) {
      console.error('Failed to create auction:', error);
      throw error;
    }
  },

  cancelAuction: async (auctionId: number): Promise<void> => {
    try {
      await axiosClient.post(`/auctions/${auctionId}/cancel`);
    } catch (error) {
      console.error('Failed to cancel auction:', error);
      throw error;
    }
  },

  // User Tracking - Fetch tracking/audit history for a user
  getTrackingUser: async (
    userId: number,
    page: number = 1,
    size: number = 20
  ): Promise<PageResponse<UserTrackingResponse>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<UserTrackingResponse>>>(
        `/users/${userId}/tracking`,
        {
          params: {
            page,
            size,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error('Failed to fetch user tracking:', error);
      throw error;
    }
  },
};

export default adminApi;
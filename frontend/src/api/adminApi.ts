import axiosClient from "./axiosClient";
import {
  ApiResponse,
  Auction,
  AuctionStatus,
  AuctionAuditResponse,
  CancelAuctionRequest,
  CancelAuctionResponse,
  PageResponse,
  User,
  UserAuditResponse,
  UserRole,
  SellerRegResponse,
  RequestStatus,
} from "./types";

export const mockUserHistory = [
  {
    id: 1,
    auctionTitle: "Vintage Car",
    bidAmount: 15000,
    time: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    auctionTitle: "Antique Watch",
    bidAmount: 5000,
    time: "2024-01-14T14:20:00Z",
  },
];

export const mockViolations = [
  {
    id: 1,
    type: "Fraudulent Bid",
    description: "Multiple accounts detected",
    time: "2024-01-10T09:00:00Z",
  },
  {
    id: 2,
    type: "Spam",
    description: "Excessive bidding",
    time: "2024-01-08T16:45:00Z",
  },
];

export const adminApi = {
  getUsers: async (
    page: number = 1,
    size: number = 20,
    keyword?: string,
    role?: UserRole,
    status?: "ACTIVE" | "BLOCKED",
  ): Promise<PageResponse<User>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<User>>>(
      "/users",
      {
        params: { page, size, keyword, role, status },
      },
    );
    return response.data.result;
  },

  blockUser: async (userId: number, reason: string): Promise<void> => {
    await axiosClient.patch(`/users/${userId}/block`, { reason });
  },

  unblockUser: async (userId: number, reason: string): Promise<void> => {
    await axiosClient.patch(`/users/${userId}/unblock`, { reason });
  },

  filterSellerAuctions: async (
    page: number = 1,
    size: number = 20,
    keyword?: string,
    status?: AuctionStatus,
    startTime?: string,
    endTime?: string,
  ): Promise<PageResponse<Auction>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<Auction>>>(
      "/auctions/filter-seller",
      {
        params: { page, size, keyword, status, startTime, endTime },
      },
    );
    return response.data.result;
  },

  filterAdminAuctions: async (
    page: number = 1,
    size: number = 20,
    keyword?: string,
    status?: AuctionStatus,
    startTime?: string,
    endTime?: string,
  ): Promise<PageResponse<Auction>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<Auction>>>(
      "/auctions/filter-admin",
      {
        params: { page, size, keyword, status, startTime, endTime },
      },
    );
    return response.data.result;
  },

  saveDraft: async (auctionData: any): Promise<Auction> => {
    const response = await axiosClient.post<ApiResponse<Auction>>(
      "/auctions/draft",
      auctionData,
    );
    return response.data.result;
  },

  scheduleAuction: async (auctionData: any): Promise<Auction> => {
    const response = await axiosClient.post<ApiResponse<Auction>>(
      "/auctions/scheduler",
      auctionData,
    );
    return response.data.result;
  },

  cancelAuction: async (
    auctionId: number,
    request: CancelAuctionRequest,
  ): Promise<CancelAuctionResponse> => {
    const response = await axiosClient.patch<
      ApiResponse<CancelAuctionResponse>
    >(`/auctions/${auctionId}/cancel`, request);
    return response.data.result;
  },

  updateDraftAuction: async (
    auctionId: number,
    updateData: any,
  ): Promise<Auction> => {
    const response = await axiosClient.put<ApiResponse<Auction>>(
      `/auctions/${auctionId}/draft`,
      updateData,
    );
    return response.data.result;
  },

  updateScheduledAuction: async (
    auctionId: number,
    updateData: any,
  ): Promise<Auction> => {
    const response = await axiosClient.put<ApiResponse<Auction>>(
      `/auctions/${auctionId}/scheduler`,
      updateData,
    );
    return response.data.result;
  },

  getUserAudit: async (
    userId: number,
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<UserAuditResponse>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<UserAuditResponse>>
    >(`/users/${userId}/audit`, {
      params: { page, size },
    });
    return response.data.result;
  },

  getAuctionAudit: async (
    auctionId: number,
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<AuctionAuditResponse>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<AuctionAuditResponse>>
    >(`/auctions/${auctionId}/audit`, {
      params: { page, size },
    });
    return response.data.result;
  },

  getRegistrations: async (
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<SellerRegResponse>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SellerRegResponse>>
    >("/sellers/registrations", {
      params: { page, size },
    });
    return response.data.result;
  },

  approveSeller: async (registrationId: number): Promise<SellerRegResponse> => {
    const response = await axiosClient.patch<ApiResponse<SellerRegResponse>>(
      `/sellers/${registrationId}/approve`,
    );
    return response.data.result;
  },

  rejectSeller: async (
    registrationId: number,
    reason: string,
  ): Promise<SellerRegResponse> => {
    const response = await axiosClient.patch<ApiResponse<SellerRegResponse>>(
      `/sellers/${registrationId}/reject`,
      null,
      {
        params: { reason },
      },
    );
    return response.data.result;
  },

  revokeSellerRole: async (userId: number, reason?: string): Promise<User> => {
    const response = await axiosClient.patch<ApiResponse<User>>(
      `/sellers/users/${userId}/revoke-role`,
      null,
      {
        params: { reason },
      },
    );
    return response.data.result;
  },
};

export default adminApi;

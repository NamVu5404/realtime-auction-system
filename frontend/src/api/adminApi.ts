import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import {
  AdminTopUpHistoryItem,
  ApiResponse,
  ApiResult,
  AiLogCountResponse,
  AiReviewDecision,
  AiReviewLog,
  Auction,
  AuctionStatus,
  AuctionAuditResponse,
  CancelAuctionRequest,
  CancelAuctionResponse,
  PageResponse,
  TopUpOrderStatus,
  User,
  UserAuditResponse,
  UserRole,
  SellerRegResponse,
  SellerResponse,
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
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<User>>>(
        "/users",
        {
          params: { page, size, keyword, role, status },
        },
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getSellers: async (
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<SellerResponse>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<SellerResponse>>
      >("/users/sellers", {
        params: { page, size },
      });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  blockUser: async (
    userId: number,
    reason: string,
  ): Promise<ApiResult<void>> => {
    try {
      const res = await axiosClient.patch<ApiResponse<void>>(
        `/users/${userId}/block`,
        { reason },
      );
      return { message: res.data.message, result: undefined as void };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  unblockUser: async (
    userId: number,
    reason: string,
  ): Promise<ApiResult<void>> => {
    try {
      const res = await axiosClient.patch<ApiResponse<void>>(
        `/users/${userId}/unblock`,
        { reason },
      );
      return { message: res.data.message, result: undefined as void };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  filterSellerAuctions: async (
    page: number = 1,
    size: number = 20,
    keyword?: string,
    status?: AuctionStatus,
    startTime?: string,
    endTime?: string,
    privateMode?: boolean,
  ): Promise<PageResponse<Auction>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<Auction>>
      >("/auctions/filter-seller", {
        params: {
          page,
          size,
          keyword,
          status,
          startTime,
          endTime,
          privateMode,
        },
      });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  filterAdminAuctions: async (
    page: number = 1,
    size: number = 20,
    keyword?: string,
    status?: AuctionStatus,
    startTime?: string,
    endTime?: string,
    privateMode?: boolean,
  ): Promise<PageResponse<Auction>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<Auction>>
      >("/auctions/filter-admin", {
        params: {
          page,
          size,
          keyword,
          status,
          startTime,
          endTime,
          privateMode,
        },
      });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  saveDraft: async (auctionData: any): Promise<Auction> => {
    try {
      const response = await axiosClient.post<ApiResponse<Auction>>(
        "/auctions/draft",
        auctionData,
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  scheduleAuction: async (auctionData: any): Promise<ApiResult<Auction>> => {
    try {
      const response = await axiosClient.post<ApiResponse<Auction>>(
        "/auctions/scheduler",
        auctionData,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  cancelAuction: async (
    auctionId: number,
    request: CancelAuctionRequest,
  ): Promise<ApiResult<CancelAuctionResponse>> => {
    try {
      const response = await axiosClient.patch<
        ApiResponse<CancelAuctionResponse>
      >(`/auctions/${auctionId}/cancel`, request);
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  updateDraftAuction: async (
    auctionId: number,
    updateData: any,
  ): Promise<ApiResult<Auction>> => {
    try {
      const response = await axiosClient.put<ApiResponse<Auction>>(
        `/auctions/${auctionId}/draft`,
        updateData,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  updateScheduledAuction: async (
    auctionId: number,
    updateData: any,
  ): Promise<ApiResult<Auction>> => {
    try {
      const response = await axiosClient.put<ApiResponse<Auction>>(
        `/auctions/${auctionId}/scheduler`,
        updateData,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getUserAudit: async (
    userId: number,
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<UserAuditResponse>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<UserAuditResponse>>
      >(`/users/${userId}/audit`, {
        params: { page, size },
      });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getAuctionAudit: async (
    auctionId: number,
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<AuctionAuditResponse>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<AuctionAuditResponse>>
      >(`/auctions/${auctionId}/audit`, {
        params: { page, size },
      });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getRegistrations: async (
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<SellerRegResponse>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<SellerRegResponse>>
      >("/sellers/registrations", {
        params: { page, size },
      });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  approveSeller: async (
    registrationId: number,
  ): Promise<ApiResult<SellerRegResponse>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<SellerRegResponse>>(
        `/sellers/${registrationId}/approve`,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  rejectSeller: async (
    registrationId: number,
    reason: string,
  ): Promise<ApiResult<SellerRegResponse>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<SellerRegResponse>>(
        `/sellers/${registrationId}/reject`,
        null,
        {
          params: { reason },
        },
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  revokeSellerRole: async (
    userId: number,
    reason?: string,
  ): Promise<ApiResult<User>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<User>>(
        `/sellers/users/${userId}/revoke-role`,
        null,
        {
          params: { reason },
        },
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  upgradeToSeller: async (userId: number): Promise<ApiResult<User>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<User>>(
        `/users/${userId}/upgrade-to-seller`,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getPendingRegistrations: async (): Promise<number> => {
    try {
      const response = await axiosClient.get<ApiResponse<number>>(
        "/sellers/registrations/pending",
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getApprovedRegistrations: async (): Promise<number> => {
    try {
      const response = await axiosClient.get<ApiResponse<number>>(
        "/sellers/registrations/approved",
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getPendingAuctionReviewCount: async (): Promise<number> => {
    try {
      const response = await axiosClient.get<ApiResponse<number>>(
        "/auctions/pending-review/count",
      );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getPendingAuctionReviews: async (
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<Auction>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<Auction>>
      >("/auctions/filter-admin", {
        params: { page, size, status: AuctionStatus.PENDING_REVIEW },
      });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  approveAuction: async (auctionId: number): Promise<ApiResult<Auction>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<Auction>>(
        `/auctions/${auctionId}/approve`,
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  rejectAuction: async (
    auctionId: number,
    reason: string,
  ): Promise<ApiResult<Auction>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<Auction>>(
        `/auctions/${auctionId}/reject`,
        null,
        { params: { reason } },
      );
      return { message: response.data.message, result: response.data.result! };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getAiLogs: async (
    page: number = 1,
    size: number = 20,
    auctionId?: number,
    decision?: AiReviewDecision,
  ): Promise<PageResponse<AiReviewLog>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<AiReviewLog>>
      >("/ai/logs", { params: { page, size, auctionId, decision } });
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getAiLogCounts: async (): Promise<AiLogCountResponse> => {
    try {
      const response =
        await axiosClient.get<ApiResponse<AiLogCountResponse>>(
          "/ai/logs/counts",
        );
      return response.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getTopUpHistory: async (params: {
    keyword?: string;
    status?: TopUpOrderStatus;
    from?: number;
    to?: number;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AdminTopUpHistoryItem>> => {
    try {
      const res = await axiosClient.get<ApiResponse<PageResponse<AdminTopUpHistoryItem>>>(
        "/admin/payments/top-up/history",
        { params }
      );
      return res.data.result!;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default adminApi;

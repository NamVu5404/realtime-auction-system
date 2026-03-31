import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import {
  Auction,
  ApiResponse,
  PaginatedAuctions,
  AuctionStatus,
  PlaceBidResponse,
  PageResponse,
  AuctionHistoryResponse,
  PlaceBidResponseV2,
  AuctionAuditResponse,
} from "./types";

/**
 * Auction API Service
 * Connects to backend endpoints:
 * - GET /auctions?status=LIVE&page=1&size=20
 * - GET /auctions/{id}
 */
export const auctionApi = {
  /**
   * Fetch paginated auctions by status
   * Backend converts frontend page (1-indexed) to Pageable offset (0-indexed)
   *
   * @param status - Auction status: LIVE, SCHEDULED, ENDED
   * @param page - Page number (1-indexed, frontend convention)
   * @param size - Items per page (default: 20)
   * @returns Promise with paginated auctions
   */
  getAuctionsByStatus: async (
    status: AuctionStatus,
    page: number = 1,
    size: number = 20,
  ): Promise<PaginatedAuctions> => {
    try {
      const response = await axiosClient.get<ApiResponse<PaginatedAuctions>>(
        "/auctions",
        {
          params: {
            status,
            // Send frontend page as-is (1-indexed) per latest change request
            page: page,
            size,
          },
        },
      );
      return response.data.result!;
    } catch (error) {
      console.error("Failed to fetch auctions by status:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Fetch single auction details
   *
   * @param auctionId - Auction ID
   * @returns Promise with auction details
   */
  getAuctionDetail: async (auctionId: number): Promise<Auction> => {
    try {
      const response = await axiosClient.get<ApiResponse<Auction>>(
        `/auctions/${auctionId}`,
      );
      return response.data.result!;
    } catch (error) {
      console.error("Failed to fetch auction detail:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Place a bid on an auction
   * Requires authentication token in header
   * Backend Endpoint: POST /api/v1/auctions/{auctionId}/bids
   *
   * @param auctionId - Auction ID in URL path
   * @param bidderId - ID of the bidder
   * @param amount - Bid amount
   * @returns Promise with PlaceBidResponse
   */
  placeBid: async (
    auctionId: number,
    bidderId: number,
    amount: number,
  ): Promise<PlaceBidResponse> => {
    try {
      const response = await axiosClient.post<ApiResponse<PlaceBidResponse>>(
        `/auctions/${auctionId}/bids`,
        {
          auctionId,
          bidderId,
          amount,
        },
      );
      return response.data.result!;
    } catch (error) {
      console.error("Failed to place bid:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Place a bid on an auction (V2)
   * Requires authentication token in header
   * Backend Endpoint: POST /api/v2/auctions/{auctionId}/bids
   *
   * @param auctionId - Auction ID in URL path
   * @param amount - Bid amount
   * @returns Promise with PlaceBidResponseV2
   */
  placeBidV2: async (
    auctionId: number,
    amount: number,
  ): Promise<ApiResponse<PlaceBidResponseV2>> => {
    try {
      // NOTE: We manually override baseURL for V2 endpoint
      const response = await axiosClient.post<ApiResponse<PlaceBidResponseV2>>(
        `http://localhost:8080/api/v2/auctions/${auctionId}/bids`,
        {
          amount,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to place bid (V2):", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Fetch auction history (bid logs)
   *
   * @param auctionId - Auction ID
   * @param page - Page number (1-indexed)
   * @param size - Items per page
   * @returns Promise with paginated auction history
   */
  getAuctionHistory: async (
    auctionId: number,
    page: number = 1,
    size: number = 20,
  ): Promise<PageResponse<AuctionHistoryResponse>> => {
    try {
      const response = await axiosClient.get<
        ApiResponse<PageResponse<AuctionHistoryResponse>>
      >(`/auctions/${auctionId}/history`, {
        params: {
          page,
          size,
        },
      });
      return response.data.result!;
    } catch (error) {
      console.error("Failed to fetch auction history:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Fetch current price directly from Redis (Smart Fallback API)
   *
   * @param auctionId - Auction ID
   * @returns Promise with current price and bidder info
   */
  getCurrentPrice: async (auctionId: number): Promise<number> => {
    try {
      const response = await axiosClient.get<ApiResponse<number>>(
        `/auctions/${auctionId}/current-price`,
      );
      return response.data.result!;
    } catch (error) {
      console.error("Failed to fetch current price:", error);
      throw new Error(extractErrorMessage(error));
    }
  },
  /**
   * Fetch final auction result (audit log)
   *
   * @param auctionId - Auction ID
   * @returns Promise with auction result details
   */
  getAuctionResult: async (
    auctionId: number,
  ): Promise<AuctionAuditResponse> => {
    try {
      const response = await axiosClient.get<ApiResponse<AuctionAuditResponse>>(
        `/auctions/${auctionId}/result`,
      );
      return response.data.result!;
    } catch (error) {
      console.error("Failed to fetch auction result:", error);
      throw new Error(extractErrorMessage(error));
    }
  },
};

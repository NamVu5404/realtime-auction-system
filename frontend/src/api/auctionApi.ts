import axiosClient from './axiosClient';
import { Auction, ApiResponse, PaginatedAuctions, AuctionStatus, PlaceBidResponse } from './types';

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
    size: number = 20
  ): Promise<PaginatedAuctions> => {
    try {
      const response = await axiosClient.get<ApiResponse<PaginatedAuctions>>(
        '/auctions',
        {
          params: {
            status,
            // Send frontend page as-is (1-indexed) per latest change request
            page: page,
            size,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error('Failed to fetch auctions by status:', error);
      throw error;
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
        `/auctions/${auctionId}`
      );
      return response.data.result;
    } catch (error) {
      console.error('Failed to fetch auction detail:', error);
      throw error;
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
  placeBid: async (auctionId: number, bidderId: number, amount: number): Promise<PlaceBidResponse> => {
    try {
      const response = await axiosClient.post<ApiResponse<PlaceBidResponse>>(
        `/auctions/${auctionId}/bids`,
        {
          auctionId,
          bidderId,
          amount,
        }
      );
      return response.data.result;
    } catch (error) {
      console.error('Failed to place bid:', error);
      throw error;
    }
  },
};

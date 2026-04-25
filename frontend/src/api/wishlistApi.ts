import { extractErrorMessage } from "./apiUtils";
import axiosClient from "./axiosClient";
import { ApiResponse, PageResponse, WishListResponse } from "./types";

export const wishlistApi = {
  /**
   * Add an auction to the wishlist
   */
  addToWishList: async (auctionId: number): Promise<WishListResponse> => {
    try {
      const response = await axiosClient.post<ApiResponse<WishListResponse>>("/wishlists", {
        auctionId,
      });
      return response.data.result!;
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Remove an auction from the wishlist
   */
  removeFromWishList: async (auctionId: number): Promise<void> => {
    try {
      await axiosClient.delete<ApiResponse<void>>(`/wishlists/${auctionId}`);
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Get the current user's wishlist
   */
  getMyWishList: async (
    page: number = 1,
    size: number = 20
  ): Promise<PageResponse<WishListResponse>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<WishListResponse>>>(
        "/wishlists",
        {
          params: {
            page,
            size,
          },
        }
      );
      return response.data.result!;
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Check wishlist status for multiple auctions in one request
   */
  checkBatch: async (auctionIds: number[]): Promise<number[]> => {
    if (!auctionIds || auctionIds.length === 0) return [];
    try {
      const response = await axiosClient.post<ApiResponse<number[]>>(
        `/wishlists/batch-check`,
        { auctionIds }
      );
      return response.data.result || [];
    } catch (error) {
      console.error("Failed to check wishlist status batch:", error);
      throw new Error(extractErrorMessage(error));
    }
  },
};

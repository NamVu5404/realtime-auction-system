import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ApiResponse, ApiResult, LiveChatMessage, ListLiveChatResponse } from "./types";

/**
 * Live Chat API Service
 * Endpoints:
 *  - GET  /live-chat/auctions/{auctionId}/history
 *  - PATCH /live-chat/{id}/hidden
 *  - PATCH /live-chat/users/{userId}/ban?minutes=X
 *
 * Note: Sending messages is done via WebSocket STOMP (useChatWebSocket),
 * not through this REST layer.
 */
export const chatApi = {
  /**
   * Load the 50 most recent (non-hidden) messages for an auction room.
   * Called once on mount to populate chat history.
   *
   * @param auctionId - Target auction ID
   * @returns Ordered list of chat messages (oldest first after client reverse)
   */
  getChatHistory: async (auctionId: number): Promise<LiveChatMessage[]> => {
    try {
      const res = await axiosClient.get<ApiResponse<ListLiveChatResponse>>(
        `/live-chat/auctions/${auctionId}/history`,
      );
      // res.data.result is now ListLiveChatResponse { data: LiveChatMessage[] }
      // Backend returns DESC (newest first) — reverse for chronological display
      const messages = res.data.result?.data ?? [];
      return [...messages].reverse();
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Admin: hide a specific message from the chat room.
   * Uses senderId and content to identify the message.
   *
   * @param auctionId - ID of the auction
   * @param senderId  - ID of the message sender
   * @param content   - Content of the message
   */
  hideMessage: async (
    auctionId: number,
    senderId: number,
    content: string,
  ): Promise<ApiResult<LiveChatMessage>> => {
    try {
      const res = await axiosClient.patch<ApiResponse<LiveChatMessage>>(
        `/live-chat/hidden`,
        null,
        { params: { auctionId, senderId, content } },
      );
      return {
        message: res.data.message,
        result: res.data.result!,
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Admin: ban a user from chatting for a specified duration.
   *
   * @param userId   - Target user ID
   * @param minutes  - Ban duration in minutes
   */
  banUserFromChat: async (
    userId: number,
    minutes: number,
  ): Promise<ApiResult<void>> => {
    try {
      const res = await axiosClient.patch<ApiResponse<void>>(
        `/live-chat/users/${userId}/ban`,
        null,
        { params: { minutes } },
      );
      return { message: res.data.message, result: undefined as void };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Admin: unban a user from chatting.
   *
   * @param userId - Target user ID
   */
  unbanUserFromChat: async (userId: number): Promise<ApiResult<void>> => {
    try {
      const res = await axiosClient.patch<ApiResponse<void>>(
        `/live-chat/users/${userId}/unban`,
      );
      return { message: res.data.message, result: undefined as void };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

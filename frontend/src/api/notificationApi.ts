import { Notification, NotificationType } from "../store/useNotificationStore";
import axiosClient from "./axiosClient";
import { ApiResponse, PageResponse } from "./types";
import { extractErrorMessage } from "./apiUtils";

export const notificationApi = {
  /**
   * Fetch user notifications
   */
  getNotifications: async (
    page: number = 1,
    size: number = 20,
  ): Promise<{
    data: Notification[];
    total: number;
  }> => {
    try {
      const response = await axiosClient.get<ApiResponse<PageResponse<any>>>(
        "/notifications",
        {
          params: {
            page,
            size,
          },
        },
      );

      const result = response.data.result;
      const mappedData: Notification[] = result.data.map((item: any) => ({
        id: String(item.id),
        type: item.type as NotificationType,
        content: item.content,
        isRead: item.read,
        createdAt: item.createdAt,
        redirectUrl: item.redirectUrl,
        metadata: item.metadata ? JSON.parse(item.metadata) : undefined,
      }));

      return {
        data: mappedData,
        total: result.totalElements,
      };
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  markAsRead: async (id: string): Promise<boolean> => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      return true;
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<boolean> => {
    // In production: return axios.put('/api/notifications/read-all');
    console.log("[Mock API] Marked all notifications as read");
    return true;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<boolean> => {
    // In production: return axios.delete(`/api/notifications/${id}`);
    console.log(`[Mock API] Deleted notification ${id}`);
    return true;
  },
};

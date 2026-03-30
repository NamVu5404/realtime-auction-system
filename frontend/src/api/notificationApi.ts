import { Notification } from "../store/useNotificationStore";
import axiosClient from "./axiosClient";
import { ApiResponse, PageResponse } from "./types";
import { extractErrorMessage } from "./apiUtils";

export const notificationApi = {
  /**
   * Get total unread count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await axiosClient.get<ApiResponse<number>>(
        "/notifications/unread-count",
      );
      return response.data.result;
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Fetch limited list for Notification Bell
   */
  getNotificationsForBell: async (): Promise<Notification[]> => {
    try {
      const response = await axiosClient.get<ApiResponse<any[]>>(
        "/notifications/bell",
      );

      return response.data.result.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        content: item.content,
        isRead: item.read,
        createdAt: item.createdAt,
        redirectUrl: item.redirectUrl,
        metadata: item.metadata,
      }));
    } catch (error) {
      console.error("Failed to fetch notifications for bell:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

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
        title: item.title,
        content: item.content,
        isRead: item.read,
        createdAt: item.createdAt,
        redirectUrl: item.redirectUrl,
        metadata: item.metadata,
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
    try {
      await axiosClient.patch("/notifications/mark-all-as-read");
      return true;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<boolean> => {
    try {
      await axiosClient.delete(`/notifications/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Delete all notifications
   */
  deleteAll: async (): Promise<boolean> => {
    try {
      await axiosClient.delete("/notifications/all");
      return true;
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
      throw new Error(extractErrorMessage(error));
    }
  },
};

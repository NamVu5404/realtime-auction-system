import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export enum NotificationType {
  // Bidder
  OUTBID = "OUTBID",
  AUCTION_START = "AUCTION_START",
  AUCTION_ENDING_SOON = "AUCTION_ENDING_SOON",
  AUCTION_ENDED_WINNER = "AUCTION_ENDED_WINNER",
  AUCTION_ENDED_LOSER = "AUCTION_ENDED_LOSER",
  AUCTION_CANCELLED = "AUCTION_CANCELLED",

  // Seller
  BID_PLACED = "BID_PLACED",
  AUCTION_ENDED_SELLER = "AUCTION_ENDED_SELLER",
  AUCTION_ENDED_NO_BIDS = "AUCTION_ENDED_NO_BIDS",
  AUCTION_APPROVED = "AUCTION_APPROVED",
  AUCTION_REJECTED = "AUCTION_REJECTED",

  // Account
  SELLER_REGISTRATION_APPROVED = "SELLER_REGISTRATION_APPROVED",
  SELLER_REGISTRATION_REJECTED = "SELLER_REGISTRATION_REJECTED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_SECURITY_ALERT = "ACCOUNT_SECURITY_ALERT",

  // System
  FRAUD_DETECTION_ALERT = "FRAUD_DETECTION_ALERT",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
}

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string;
  metadata?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) =>
        set((state) => {
          // Avoid duplicates by ID if message arrives multiple times
          if (state.notifications.some((n) => n.id === notification.id)) {
            return state;
          }
          return {
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          };
        }),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),
      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        }),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: "auction-notifications",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { useEffect, useRef } from "react";
import {
  useNotificationStore,
  Notification,
} from "../store/useNotificationStore";
import { useAuthStore } from "../store/useAuthStore";
import { notificationApi } from "../api/notificationApi";
import notificationSound from "../assets/audio/notification-sound.mp3";
import { notification as antdNotification } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ENV } from "../config/env";

/**
 * Hook to manage real-time notifications via WebSocket
 */
export const useNotificationWebSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification, setNotifications, setUnreadCount } =
    useNotificationStore();
  const stompClient = useRef<Client | null>(null);

  // Initial fetch of notifications & unread count
  useEffect(() => {
    if (isAuthenticated && user) {
      // 1. Fetch unread count for the Badge
      notificationApi.getUnreadCount().then((count) => {
        setUnreadCount(count);
      });

      // 2. Fetch recent notifications for the Bell list
      notificationApi.getNotificationsForBell().then((notifs) => {
        setNotifications(notifs);
      });
    }
  }, [isAuthenticated, user, setNotifications, setUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = ENV.WS_URL;

    // Set up STOMP client
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[NotificationWS] Connected");

        // Subscribe to user-specific topic (Matches Backend mapping)
        client.subscribe(`/topic/notifications/${user.id}`, (message) => {
          const data = JSON.parse(message.body);

          // Map backend fields to frontend Notification interface
          const newNotif: Notification = {
            id: String(data.id),
            title: data.title,
            content: data.content,
            isRead: data.read, // Map 'read' to 'isRead'
            createdAt: data.createdAt,
            redirectUrl: data.redirectUrl,
            metadata: data.metadata,
          };

          // Add to store (updates Bell and Badge)
          addNotification(newNotif);

          // Play sound
          new Audio(notificationSound).play().catch(() => {});
        });
      },
      onStompError: (frame) => {
        console.error(
          "[NotificationWS] STOMP Error:",
          frame.headers["message"],
        );
      },
      onWebSocketClose: () => {
        console.log("[NotificationWS] Disconnected");
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [isAuthenticated, user, addNotification]);

  return { isConnected: stompClient.current?.connected };
};

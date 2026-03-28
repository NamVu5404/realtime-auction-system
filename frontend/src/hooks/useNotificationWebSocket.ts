import { useEffect, useRef } from "react";
import {
  useNotificationStore,
  Notification,
} from "../store/useNotificationStore";
import { useAuthStore } from "../store/useAuthStore";
import { notificationApi } from "../api/notificationApi";
import { notification as antdNotification } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Hook to manage real-time notifications via WebSocket
 */
export const useNotificationWebSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification, setNotifications } = useNotificationStore();
  const stompClient = useRef<Client | null>(null);

  // Initial fetch of notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      notificationApi.getNotifications().then((res) => {
        setNotifications(res.data);
      });
    }
  }, [isAuthenticated, user, setNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl =
      import.meta.env.VITE_WS_URL || "http://localhost:8080/api/ws";

    // Set up STOMP client
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[NotificationWS] Connected");

        // Subscribe to user-specific private topic
        // Backend pattern: messagingTemplate.convertAndSendToUser(userId, "/topic/notifications", message)
        client.subscribe(`/user/${user.id}/topic/notifications`, (message) => {
          const newNotif: Notification = JSON.parse(message.body);

          // Add to store
          addNotification(newNotif);

          // Show browser/app toast for immediate feedback
          antdNotification.info({
            message: newNotif.title || "Thông báo mới",
            description: newNotif.content,
            placement: "topRight",
            duration: 5,
          });
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

import { Client, Message } from "@stomp/stompjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore - sockjs-client doesn't have TypeScript definitions
import SockJS from "sockjs-client";
import type { BidUpdateMessage } from "../api/types";
import { ENV } from "../config/env";

interface UseWebSocketOptions {
  onPriceUpdate?: (event: BidUpdateMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { onPriceUpdate, onConnect, onDisconnect, onError } = options;

  const subscriptionRef = useRef<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Create STOMP client with useMemo to prevent recreating on every render
   * Only depend on individual callbacks, not the options object
   */
  const client = useMemo(() => {
    const wsUrl = ENV.WS_URL;

    return new Client({
      webSocketFactory: () => {
        return new SockJS(wsUrl);
      },
      connectHeaders: {
        "Content-Type": "application/json",
      },
      debug: (str) => {
        if (str.includes("CONNECT") || str.includes("DISCONNECT")) {
          console.log("[STOMP]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        console.log("WebSocket connected");

        // Subscribe to auction price updates
        subscriptionRef.current = client.subscribe(
          "/topic/auctions",
          (message: Message) => {
            try {
              const event = JSON.parse(message.body) as BidUpdateMessage;
              onPriceUpdate?.(event);
            } catch (error) {
              console.error("Failed to parse message:", error);
            }
          },
        );

        // Subscribe to personal notifications
        client.subscribe("/user/queue/notifications", (message: Message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log("Notification:", notification);
          } catch (error) {
            console.error("Failed to parse notification:", error);
          }
        });

        onConnect?.();
      },
      onStompError: (frame) => {
        setIsConnected(false);
        const errorMsg = `Broker reported error: ${frame.headers["message"]}`;
        console.error(errorMsg);
        onError?.(errorMsg);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
        console.log("WebSocket closed");
        onDisconnect?.();
      },
      onWebSocketError: (event: Event) => {
        setIsConnected(false);
        console.error("WebSocket error:", event);
        onError?.("WebSocket connection error");
      },
    });
  }, [onPriceUpdate, onConnect, onDisconnect, onError]);

  const connect = useCallback(() => {
    if (!client.connected) {
      client.activate();
    }
  }, [client]);

  const disconnect = useCallback(() => {
    if (client.connected) {
      client.deactivate();
      setIsConnected(false);
    }
  }, [client]);

  const subscribe = useCallback(
    (destination: string, callback: (message: Message) => void) => {
      if (client.connected) {
        return client.subscribe(destination, callback);
      }
      console.warn("WebSocket not connected. Cannot subscribe to", destination);
      return null;
    },
    [client],
  );

  const publish = useCallback(
    (destination: string, body: Record<string, any>) => {
      if (client.connected) {
        client.publish({
          destination,
          body: JSON.stringify(body),
        });
      } else {
        console.warn("WebSocket not connected. Cannot publish to", destination);
      }
    },
    [client],
  );

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    publish,
  };
};

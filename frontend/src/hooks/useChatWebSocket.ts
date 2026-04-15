import { Client, Message } from "@stomp/stompjs";
import { useCallback, useEffect, useMemo, useState } from "react";
// @ts-ignore - sockjs-client doesn't have TypeScript definitions
import SockJS from "sockjs-client";
import { ENV } from "../config/env";
import { LiveChatMessage } from "../api/types";

import { useAuthStore } from "../store/useAuthStore";
import { jwtDecode } from "jwt-decode";
import { authApi } from "../api/authApi";

interface UseChatWebSocketOptions {
  auctionId: number;
  onMessage: (msg: LiveChatMessage) => void;
  /**
   * Only activate the WebSocket connection when true.
   * Pass `isLive` to avoid connecting for ENDED/SCHEDULED auctions.
   */
  enabled: boolean;
  onError?: (msg: string) => void;
}

interface UseChatWebSocketReturn {
  isConnected: boolean;
  sendMessage: (content: string) => void;
}

/**
 * Custom hook for live chat WebSocket in an auction room.
 *
 * Features:
 * - STOMP over SockJS, independent of useAuctionWebsocket
 * - Subscribe: /topic/chat/{auctionId}
 * - Publish:   /app/chat/{auctionId}
 * - Only activates when `enabled` is true (auction is LIVE)
 * - STOMP native reconnection (5s delay)
 *
 * @param options - auctionId, onMessage callback, enabled flag
 * @returns isConnected status and sendMessage function
 */
export const useChatWebSocket = ({
  auctionId,
  onMessage,
  enabled,
  onError,
}: UseChatWebSocketOptions): UseChatWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken, refreshToken, setTokens } = useAuthStore();

  const checkAndRefreshToken = useCallback(async () => {
    if (!accessToken || !refreshToken) return;

    try {
      const decoded = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000;
      // If token is expired or expires in less than 30 seconds
      if (decoded.exp && decoded.exp - currentTime < 30) {
        console.log("[Chat WS] Token expiring soon, refreshing...");
        const result = await authApi.refreshToken({ accessToken, refreshToken });
        setTokens(result.accessToken, result.refreshToken);
        return true; // Token was refreshed
      }
    } catch (err) {
      console.error("[Chat WS] Token check failed:", err);
    }
    return false;
  }, [accessToken, refreshToken, setTokens]);

  const client = useMemo(() => {
    return new Client({
      webSocketFactory: () => new SockJS(ENV.WS_URL),

      connectHeaders: {
        "Content-Type": "application/json",
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },

      debug: (str) => {
        if (str.includes("CONNECT") || str.includes("DISCONNECT")) {
          console.log("[Chat STOMP]", str);
        }
      },

      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000,

      onConnect: () => {
        console.log(`[Chat WS] Connected to auction ${auctionId}`);
        setIsConnected(true);

        client.subscribe(`/topic/chat/${auctionId}`, (frame: Message) => {
          try {
            const msg = JSON.parse(frame.body) as LiveChatMessage;
            onMessage(msg);
          } catch (err) {
            console.error("[Chat WS] Failed to parse message:", err);
          }
        });

        // Subscribe to private error topic
        client.subscribe("/user/topic/errors", (frame: Message) => {
          try {
            const errorRes = JSON.parse(frame.body);
            console.error("[Chat WS] Received error:", errorRes);
            if (onError && errorRes.message) {
              onError(errorRes.message);
            }
          } catch (err) {
            console.error("[Chat WS] Failed to parse error frame:", err);
          }
        });
      },

      onStompError: (frame) => {
        console.error(
          `[Chat WS] STOMP error for auction ${auctionId}:`,
          frame.headers["message"],
        );
        setIsConnected(false);
      },

      onWebSocketClose: () => {
        console.log(`[Chat WS] Closed for auction ${auctionId}`);
        setIsConnected(false);
      },

      onWebSocketError: (event) => {
        console.error(`[Chat WS] Error for auction ${auctionId}:`, event);
        setIsConnected(false);
      },
    });
  }, [auctionId, onMessage, accessToken]);

  useEffect(() => {
    if (!enabled) return;

    const activate = async () => {
      await checkAndRefreshToken();
      console.log(`[Chat WS] Activating for auction ${auctionId}`);
      client.activate();
    };

    activate();

    return () => {
      console.log(`[Chat WS] Deactivating for auction ${auctionId}`);
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [auctionId, client, enabled]);

  const sendMessage = useCallback(
    async (content: string) => {
      // Proactively check/refresh token before sending
      await checkAndRefreshToken();

      if (!client.connected) {
        console.warn("[Chat WS] Not connected — cannot send message");
        return;
      }
      client.publish({
        destination: `/app/auction/${auctionId}`,
        body: JSON.stringify({ content } satisfies { content: string }),
      });
    },
    [client, auctionId, checkAndRefreshToken],
  );

  return { isConnected, sendMessage };
};

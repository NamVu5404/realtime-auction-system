import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import React from "react";
import { Client, Message } from "@stomp/stompjs";
// @ts-ignore - sockjs-client doesn't have TypeScript definitions
import SockJS from "sockjs-client";
import { useQueryClient } from "@tanstack/react-query";
import { notification } from "../utils/antdStatic";
import { BidUpdateMessage } from "../api/types";
import formatCurrency from "../utils/format";

interface UseAuctionWebsocketOptions {
  auctionId: number;
  onBidUpdate?: (message: BidUpdateMessage) => void;
  onTimeExtended?: (newEndTime: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

interface UseAuctionWebsocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  lastBidTime?: number;
}

/**
 * Custom hook for managing WebSocket connections to auction bidding updates
 *
 * Features:
 * - STOMP over SockJS connection to /topic/auction/{auctionId}
 * - Heartbeat monitoring (incoming/outgoing every 10s)
 * - STOMP native reconnection mechanism (5s delay)
 * - Cache invalidation on reconnect to sync with server state
 * - Time extension handling with UI notifications
 * - Real-time bid update notifications
 *
 * @param options - Configuration options including auctionId and callbacks
 * @returns Object with connection status and last bid timestamp
 */
export const useAuctionWebsocket = (options: UseAuctionWebsocketOptions) => {
  const {
    auctionId,
    onBidUpdate,
    onTimeExtended,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const subscriptionRef = useRef<any | null>(null);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastBidTime, setLastBidTime] = useState<number | undefined>();

  /**
   * Handle incoming bid update messages from WebSocket
   */
  const handleBidUpdate = useCallback(
    (message: Message) => {
      try {
        const rawBody = JSON.parse(message.body);

        // Ignore PING messages — handled globally by useHeartbeat
        if (rawBody.type === "PING") return;

        // Normalize fields (V1 uses currentPrice, V2 uses amount)
        const bidUpdate: BidUpdateMessage = {
          ...rawBody,
          currentPrice:
            rawBody.amount !== undefined
              ? rawBody.amount
              : rawBody.currentPrice,
          highestBidderId:
            rawBody.bidderId !== undefined
              ? rawBody.bidderId
              : rawBody.highestBidderId,
          highestBidderName: rawBody.highestBidderName || rawBody.bidderName,
          bidderName: rawBody.bidderName,
          // finalEndTime is always present as ISO string from backend
          finalEndTime: rawBody.finalEndTime,
        };

        console.log("[WS] Bid update received:", {
          auctionId: bidUpdate.auctionId,
          currentPrice: bidUpdate.currentPrice,
          finalEndTime: bidUpdate.finalEndTime,
          extended: bidUpdate.extended,
        });
        setLastBidTime(Date.now());

        // 1. Let consumer handle ALL state updates (price, bidder, endTime)
        onBidUpdate?.(bidUpdate);

        // 2. Visual notification only when time was extended
        if (bidUpdate.extended && bidUpdate.finalEndTime) {
          console.log(
            `[WS] Auction ${auctionId} time extended to:`,
            bidUpdate.finalEndTime,
          );
          onTimeExtended?.(bidUpdate.finalEndTime);

          notification.info({
            key: `extend-${auctionId}`,
            message: "⏰ Time Extended!",
            description: "Auction time extended due to a last-moment bid!",
            duration: 3,
            className: "bid-notification bid-notification--info",
          });
        }

        // 3. Global bid notification
        notification.success({
          key: `bid-${auctionId}`,
          message: "New Bid Placed",
          description: `${bidUpdate.highestBidderName || "Người đấu giá"} đã đặt giá ${formatCurrency(bidUpdate.currentPrice || 0)}!`,
          duration: 3,
          className: "bid-notification bid-notification--success",
        });
      } catch (error) {
        console.error("[WS] Failed to parse bid update message:", error);
      }
    },
    [auctionId, onBidUpdate, onTimeExtended],
  );


  /**
   * Create STOMP client with native reconnection mechanism
   * Uses useMemo to prevent recreating client instance on every render
   */
  const client = useMemo(() => {
    // WebSocket URL. Prefer environment variable, fallback to backend path
    // Backend uses context-path '/api/v1' so endpoint is /api/ws
    const wsUrl =
      (import.meta as any).env?.VITE_WS_URL || "http://localhost:8080/api/ws";

    return new Client({
      // Use SockJS factory for better browser compatibility
      webSocketFactory: () => new SockJS(wsUrl),

      // Connect headers
      connectHeaders: {
        "Content-Type": "application/json",
      },

      // Debug logging (only important messages)
      debug: (str) => {
        if (str.includes("CONNECT") || str.includes("DISCONNECT")) {
          console.log("[STOMP]", str);
        }
      },

      // **CRITICAL**: Heartbeat configuration for detecting broken connections
      heartbeatIncoming: 10000, // 10 seconds
      heartbeatOutgoing: 10000, // 10 seconds

      // **CRITICAL**: Use STOMP's native reconnection (not manual scheduling)
      // This prevents the infinite spam loop
      reconnectDelay: 5000, // 5 seconds between reconnection attempts

      // Connection success handler
      onConnect: () => {
        console.log(`Connected to auction ${auctionId} WebSocket`);
        setIsConnected(true);
        setIsReconnecting(false);

        // Subscribe to auction-specific topic
        const topic = `/topic/auction/${auctionId}`;
        subscriptionRef.current = client.subscribe(topic, handleBidUpdate);

        // Sync local state with server by invalidating queries
        queryClient.invalidateQueries({
          queryKey: ["auction", auctionId],
        });

        onConnect?.();
      },

      // STOMP protocol error handler
      onStompError: (frame) => {
        const errorMsg = `STOMP error for auction ${auctionId}: ${frame.headers["message"]}`;
        console.error(errorMsg);
        setIsConnected(false);
        setIsReconnecting(true);
        onError?.(errorMsg);
      },

      // WebSocket close handler
      onWebSocketClose: () => {
        console.log(`WebSocket closed for auction ${auctionId}`);
        setIsConnected(false);
        setIsReconnecting(true);
        onDisconnect?.();
      },

      // WebSocket error handler
      onWebSocketError: (event: Event) => {
        const errorMsg = `WebSocket error for auction ${auctionId}`;
        console.error(errorMsg, event);
        setIsConnected(false);
        setIsReconnecting(true);
        onError?.(errorMsg);
      },
    });
  }, [
    auctionId,
    queryClient,
    handleBidUpdate,
    onConnect,
    onDisconnect,
    onError,
  ]);

  /**
   * Effect: Activate client on mount, deactivate on unmount
   */
  useEffect(() => {
    console.log(`Activating WebSocket for auction ${auctionId}`);
    client.activate();

    return () => {
      console.log(`Deactivating WebSocket for auction ${auctionId}`);
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [auctionId, client]);

  return {
    isConnected,
    isReconnecting,
    lastBidTime,
  };
};

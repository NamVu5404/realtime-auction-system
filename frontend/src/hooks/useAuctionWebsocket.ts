import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Client, Message } from '@stomp/stompjs';
// @ts-ignore - sockjs-client doesn't have TypeScript definitions
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import { BidUpdateMessage } from '../api/types';

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
        const bidUpdate = JSON.parse(message.body) as BidUpdateMessage;

        console.log('Bid update received:', bidUpdate);
        setLastBidTime(Date.now());

        // Call user-provided callback
        onBidUpdate?.(bidUpdate);

        // Handle time extension
        if (bidUpdate.extended && bidUpdate.newEndTime) {
          console.log(`Auction ${auctionId} time extended to:`, bidUpdate.newEndTime);
          onTimeExtended?.(bidUpdate.newEndTime);

          // Show visual alert for time extension
          notification.info({
            message: 'Time Extended!',
            description: `Auction time extended due to new bid!`,
            duration: 3,
            style: {
              backgroundColor: '#FFC107',
              color: '#000',
            },
          });
        }

        // Show global notification for new bid with Vietnamese message
        notification.success({
          message: 'New Bid Placed',
          description: `${bidUpdate.highestBidderName} đã đặt giá $${bidUpdate.currentPrice.toFixed(2)}!`,
          duration: 3,
        });
      } catch (error) {
        console.error('Failed to parse bid update message:', error);
      }
    },
    [auctionId, onBidUpdate, onTimeExtended]
  );

  /**
   * Create STOMP client with native reconnection mechanism
   * Uses useMemo to prevent recreating client instance on every render
   */
  const client = useMemo(() => {
    // Hard-coded WebSocket URL for consistency
    // Matches backend configuration: http://localhost:8080/ws
    const wsUrl = 'http://localhost:8080/ws';

    return new Client({
      // Use SockJS factory for better browser compatibility
      webSocketFactory: () => new SockJS(wsUrl),
      
      // Connect headers
      connectHeaders: {
        'Content-Type': 'application/json',
      },

      // Debug logging (only important messages)
      debug: (str) => {
        if (str.includes('CONNECT') || str.includes('DISCONNECT')) {
          console.log('[STOMP]', str);
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
          queryKey: ['auction', auctionId],
        });

        onConnect?.();
      },

      // STOMP protocol error handler
      onStompError: (frame) => {
        const errorMsg = `STOMP error for auction ${auctionId}: ${frame.headers['message']}`;
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
  }, [auctionId, queryClient, handleBidUpdate, onConnect, onDisconnect, onError]);

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

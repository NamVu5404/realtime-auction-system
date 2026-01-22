import { useEffect, useRef, useCallback } from 'react';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PricePingEvent } from '../types';

interface UseWebSocketOptions {
  onPriceUpdate?: (event: PricePingEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const clientRef = useRef<Client | null>(null);
  const connectingRef = useRef(false);

  const connect = useCallback(() => {
    if (clientRef.current?.connected || connectingRef.current) {
      return;
    }

    connectingRef.current = true;

    const client = new Client({
      webSocketFactory: () => {
        const wsUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:8080/ws';
        return new SockJS(wsUrl);
      },
      connectHeaders: {
        'Content-Type': 'application/json',
      },
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        connectingRef.current = false;
        console.log('WebSocket connected');

        // Subscribe to auction price updates
        client.subscribe('/topic/auctions', (message: Message) => {
          try {
            const event = JSON.parse(message.body) as PricePingEvent;
            options.onPriceUpdate?.(event);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        });

        // Subscribe to personal notifications
        client.subscribe('/user/queue/notifications', (message: Message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('Notification:', notification);
          } catch (error) {
            console.error('Failed to parse notification:', error);
          }
        });

        options.onConnect?.();
      },
      onStompError: (frame) => {
        connectingRef.current = false;
        const errorMsg = `Broker reported error: ${frame.headers['message']}`;
        console.error(errorMsg);
        options.onError?.(errorMsg);
      },
      onWebSocketClose: () => {
        connectingRef.current = false;
        console.log('WebSocket closed');
        options.onDisconnect?.();
      },
    });

    clientRef.current = client;
    client.activate();
  }, [options]);

  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
      clientRef.current = null;
      options.onDisconnect?.();
    }
  }, [options]);

  const subscribe = useCallback(
    (destination: string, callback: (message: Message) => void) => {
      if (clientRef.current?.connected) {
        return clientRef.current.subscribe(destination, callback);
      }
      console.warn('WebSocket not connected. Cannot subscribe to', destination);
      return null;
    },
    []
  );

  const publish = useCallback(
    (destination: string, body: Record<string, any>) => {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination,
          body: JSON.stringify(body),
        });
      } else {
        console.warn('WebSocket not connected. Cannot publish to', destination);
      }
    },
    []
  );

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: clientRef.current?.connected ?? false,
    connect,
    disconnect,
    subscribe,
    publish,
  };
};

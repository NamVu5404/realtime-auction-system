import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
// @ts-ignore - sockjs-client doesn't have TypeScript definitions
import SockJS from "sockjs-client";
import { useUIStore } from "../store/useUIStore";
import { ENV } from "../config/env";

const HEARTBEAT_TOPIC = "/topic/heartbeat";
const HEARTBEAT_TIMEOUT_MS = 12000; // 2 missed PINGs (5s each) + 2s buffer

/**
 * useHeartbeat — Global Kafka pipeline health monitor
 *
 * ⚠️  Mount this ONCE in App.jsx or a top-level layout.
 *     All components should read isKafkaAlive from useUIStore instead.
 *
 * Subscribes to /topic/heartbeat via STOMP WebSocket.
 * Backend sends a PING every 5s through the full Kafka pipeline.
 * If no PING arrives within 12s → Kafka/Consumer is considered DOWN.
 *
 * Updates isKafkaAlive and lastHeartbeatTime in useUIStore (global singleton),
 * making the health status available anywhere without extra connections.
 */
export const useHeartbeat = () => {
  const { setKafkaAlive, setLastHeartbeatTime } = useUIStore();
  const lastPingTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const wsUrl = ENV.WS_URL;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000,

      onConnect: () => {
        console.log("[Heartbeat] Connected — monitoring Kafka pipeline");
        const now = Date.now();
        lastPingTimeRef.current = now;
        setLastHeartbeatTime(now);

        client.subscribe(HEARTBEAT_TOPIC, () => {
          const pingTime = Date.now();
          lastPingTimeRef.current = pingTime;
          setLastHeartbeatTime(pingTime);

          // Only log recovery (avoid noisy updates on every PING)
          setKafkaAlive(true);
        });
      },

      onWebSocketClose: () => {
        console.warn("[Heartbeat] WebSocket closed");
      },

      debug: () => {}, // Suppress STOMP debug noise
    });

    client.activate();

    // Watchdog: detects if 2+ PINGs have been missed
    const watchdog = setInterval(() => {
      const silenceMs = Date.now() - lastPingTimeRef.current;
      if (silenceMs > HEARTBEAT_TIMEOUT_MS) {
        console.warn(
          `[Heartbeat] No PING for ${silenceMs}ms — Kafka pipeline DOWN`,
        );
        setKafkaAlive(false);
      }
    }, 3000);

    return () => {
      clearInterval(watchdog);
      if (client.connected) {
        client.deactivate();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Empty deps: this effect runs once on mount and cleans up on unmount
  // setKafkaAlive/setLastHeartbeatTime are stable Zustand actions — safe to omit
};

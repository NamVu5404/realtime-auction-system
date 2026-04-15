import { CommentOutlined, LoadingOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi } from "../../../api/chatApi";
import { extractErrorMessage } from "../../../api/apiUtils";
import { LiveChatMessage } from "../../../api/types";
import { useChatWebSocket } from "../../../hooks/useChatWebSocket";
import { useAuthStore } from "../../../store/useAuthStore";
import { message } from "../../../utils/antdStatic";
import ChatInput from "./ChatInput";
import ChatMessageItem from "./ChatMessageItem";

interface AuctionChatPanelProps {
  auctionId: number;
  isLive: boolean;
  currentUserId?: number;
  sellerId?: number;
  isAdmin?: boolean;
  /** Passed from FloatingChat so panel can scroll to bottom when re-opened */
  isOpen: boolean;
}

/**
 * AuctionChatPanel — Real-time chat panel for an auction room.
 *
 * - Loads history via REST on mount once (seeded into local state)
 * - Receives new messages in real-time via WebSocket (/topic/chat/{id})
 * - Panel stays mounted (hidden via CSS in FloatingChat) so WS and state
 *   are preserved across open/close toggles.
 * - Auto-scrolls to latest message on new message OR when re-opened.
 */
const AuctionChatPanel = ({
  auctionId,
  isLive,
  currentUserId,
  sellerId,
  isAdmin,
  isOpen,
}: AuctionChatPanelProps) => {
  const [liveMessages, setLiveMessages] = useState<LiveChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ─── Moderation Mutations ──────────────────────────────────────────────────
  const hideMutation = useMutation({
    mutationFn: ({ senderId, content }: { senderId: number; content: string }) =>
      chatApi.hideMessage(auctionId, senderId, content),
    onSuccess: (apiRes, variables) => {
      // Optimistic UI: remove from local state immediately
      setLiveMessages((prev) =>
        prev.filter(
          (m) =>
            !(m.senderId === variables.senderId && m.content === variables.content),
        ),
      );
      message.success(apiRes.message);
    },
    onError: (error) => message.error(extractErrorMessage(error)),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, minutes }: { userId: number; minutes: number }) =>
      chatApi.banUserFromChat(userId, minutes),
    onSuccess: (apiRes) => message.success(apiRes.message),
    onError: (error) => message.error(extractErrorMessage(error)),
  });

  // ─── History (REST) — fetched once, seeded into local state ────────────────
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["chatHistory", auctionId],
    queryFn: () => chatApi.getChatHistory(auctionId),
    staleTime: Infinity, // WS keeps state live; REST is only the initial seed
    retry: false,
    meta: {
      onError: (error: unknown) => {
        message.error(extractErrorMessage(error));
      },
    },
  });

  // Seed live messages from history once on mount
  useEffect(() => {
    if (history && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setLiveMessages(history);
    }
  }, [history]);

  // ─── WebSocket (real-time) ─────────────────────────────────────────────────
  const handleIncomingMessage = useCallback((msg: LiveChatMessage) => {
    // If message is marked as hidden, remove it from local state
    if (msg.hidden) {
      setLiveMessages((prev) =>
        prev.filter(
          (m) => !(m.senderId === msg.senderId && m.content === msg.content),
        ),
      );
      return;
    }

    setLiveMessages((prev) => {
      // Deduplicate: skip if same sender + timestamp already in state
      // (can happen if WS delivers a message that was already in history)
      const isDuplicate = prev.some(
        (m) =>
          m.senderId === msg.senderId &&
          m.createdAt === msg.createdAt &&
          m.content === msg.content,
      );
      if (isDuplicate) return prev;
      return [...prev, msg];
    });
  }, []);

  const { isConnected, sendMessage } = useChatWebSocket({
    auctionId,
    onMessage: handleIncomingMessage,
    enabled: isLive,
    onError: (msg) => message.error(msg),
  });

  // ─── Auto-scroll on new message ────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages]);

  // ─── Scroll to bottom when chat window opens (messages already in state) ───
  useEffect(() => {
    if (isOpen) {
      // Use instant scroll here so user doesn't see a jarring smooth animation
      // from the top when the window just became visible
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isOpen]);

  // ─── Send handler ──────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "450px",
      }}
    >
      {/* Message list */}
      <div
        id="chat-message-list"
        className="chat-message-list"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {historyLoading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin
              indicator={
                <LoadingOutlined style={{ color: "rgba(255,255,255,0.3)" }} />
              }
            />
          </div>
        ) : liveMessages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "var(--color-text-muted)",
            }}
          >
            <CommentOutlined style={{ fontSize: "32px", opacity: 0.5 }} />
            <span style={{ fontSize: "13px" }}>
              {isLive ? "Be the first to say something!" : "No messages yet."}
            </span>
          </div>
        ) : (
          liveMessages.map((msg, idx) => (
            <ChatMessageItem
              key={`${msg.senderId}-${msg.createdAt ?? idx}`}
              message={msg}
              currentUserId={currentUserId}
              sellerId={sellerId}
              isAdmin={isAdmin}
              onHide={(senderId, content) =>
                hideMutation.mutate({ senderId, content })
              }
              onBan={(userId, mins) => banMutation.mutate({ userId, minutes: mins })}
            />
          ))
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input or closed notice */}
      {isLive ? (
        <ChatInput
          onSend={handleSend}
          disabled={!isConnected}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--color-border)",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--color-text-muted)",
            background: "var(--color-bg)",
            opacity: 0.8,
          }}
        >
          Chat is only available during a live auction.
        </div>
      )}
    </div>
  );
};

export default AuctionChatPanel;

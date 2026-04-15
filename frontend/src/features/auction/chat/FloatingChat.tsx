import { MessageFilled, CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import AuctionChatPanel from "./AuctionChatPanel";

interface FloatingChatProps {
  auctionId: number;
  isLive: boolean;
  currentUserId?: number;
  sellerId?: number;
  isAdmin?: boolean;
}

/**
 * FloatingChat — Refined premium UI using design tokens from index.css.
 * - Uses .chat-floating-wrapper, .chat-toggle-button, .chat-window-container.
 * - No hardcoded hex codes or redundant inline styles.
 */
const FloatingChat = ({
  auctionId,
  isLive,
  currentUserId,
  sellerId,
  isAdmin,
}: FloatingChatProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen((prev) => !prev);

  return (
    <div className="chat-floating-wrapper">
      {/* Chat Window — always mounted to preserve WS state, hidden via CSS */}
      <div
        className="chat-window-container"
        style={{ display: isOpen ? "flex" : "none" }}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <MessageFilled style={{ color: "var(--color-gold-start)" }} />
            <span>Live Chat</span>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setIsOpen(false)}
            className="chat-close-btn"
            style={{ color: "var(--color-text-muted)" }}
          />
        </div>

        {/* Panel Content */}
        <AuctionChatPanel
          auctionId={auctionId}
          isLive={isLive}
          currentUserId={currentUserId}
          sellerId={sellerId}
          isAdmin={isAdmin}
          isOpen={isOpen}
        />
      </div>

      {/* Toggle FAB */}
      <button
        type="button"
        className={`chat-toggle-button ${isOpen ? "active" : ""}`}
        onClick={toggleChat}
        aria-label="Toggle Auction Chat"
      >
        {isOpen ? <CloseOutlined /> : <MessageFilled />}
      </button>
    </div>
  );
};

export default FloatingChat;

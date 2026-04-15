import { EyeInvisibleOutlined, StopOutlined } from "@ant-design/icons";
import { Modal, Tooltip, Popconfirm, Tag } from "antd";
import { memo, useState } from "react";
import { LiveChatMessage, UserRole } from "../../../api/types";
import { getAvatarUrl } from "../../../utils/imageUtils";

// Java Integer.MAX_VALUE — safe upper bound for "permanent" ban
const PERMANENT_BAN_MINUTES = 2_147_483_647;

const BAN_OPTIONS: { label: string; minutes: number }[] = [
  { label: "1 minute", minutes: 1 },
  { label: "5 minutes", minutes: 5 },
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "6 hours", minutes: 360 },
  { label: "1 day", minutes: 1_440 },
  { label: "7 days", minutes: 10_080 },
  { label: "30 days", minutes: 43_200 },
  { label: "Permanent", minutes: PERMANENT_BAN_MINUTES },
];

interface ChatMessageItemProps {
  message: LiveChatMessage;
  currentUserId?: number;
  sellerId?: number;
  isAdmin?: boolean;
  onHide?: (senderId: number, content: string) => void;
  onBan?: (userId: number, minutes: number) => void;
}

/**
 * Single chat message row.
 * - Own messages: right-aligned with gold accent bubble
 * - Others' messages: left-aligned with avatar
 * - Admin-only: hover reveals Hide / Ban action buttons
 */
const ChatMessageItem = memo(
  ({
    message,
    currentUserId,
    sellerId,
    isAdmin,
    onHide,
    onBan,
  }: ChatMessageItemProps) => {
    const isOwn = message.senderId === currentUserId;
    const [hovered, setHovered] = useState(false);
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [selectedMinutes, setSelectedMinutes] = useState<number>(60);

    const showAdminActions = isAdmin && !isOwn;

    const formatTime = (iso?: string) => {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const handleBanConfirm = () => {
      onBan?.(message.senderId, selectedMinutes);
      setBanModalOpen(false);
      setSelectedMinutes(60);
    };

    const selectedLabel =
      BAN_OPTIONS.find((o) => o.minutes === selectedMinutes)?.label ?? "1 hour";

    const renderRoleTag = () => {
      const role = message.senderRole;
      if (!role) return null;

      // Priority: Admin > Seller (only if they are the seller of THIS auction)
      // Note: Backend now sends single prioritized role.
      if (role === UserRole.ADMIN) {
        return (
          <Tag
            style={{
              borderColor: "#FED469",
              color: "#FED469",
              fontSize: "9px",
              lineHeight: "13px",
              padding: "0 4px",
              margin: 0,
              background: "transparent",
              fontWeight: 700,
            }}
          >
            ADMIN
          </Tag>
        );
      }
      if (role === UserRole.SELLER && message.senderId === sellerId) {
        return (
          <Tag
            color="blue"
            style={{
              fontSize: "9px",
              lineHeight: "13px",
              padding: "0 4px",
              margin: 0,
              fontWeight: 700,
            }}
          >
            SELLER
          </Tag>
        );
      }
      return null;
    };

    return (
      <>
        <div
          onMouseEnter={() => showAdminActions && setHovered(true)}
          onMouseLeave={() => showAdminActions && setHovered(false)}
          style={{
            display: "flex",
            flexDirection: isOwn ? "row-reverse" : "row",
            alignItems: "flex-end",
            gap: "8px",
            marginBottom: "12px",
            position: "relative",
          }}
        >
          {/* Avatar — shown for others only */}
          {!isOwn && (
            <img
              src={getAvatarUrl(message.senderAvatar)}
              alt={message.senderName}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                border: "1px solid var(--color-border-md)",
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: isOwn ? "flex-end" : "flex-start",
              maxWidth: "85%",
              gap: "4px",
            }}
          >
            {/* Sender name — shown for others only */}
            {!isOwn && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  paddingLeft: "4px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {message.senderName}
                  {renderRoleTag()}
                </div>
              </span>
            )}

            {/* Bubble */}
            <div
              className={`chat-bubble ${isOwn ? "chat-bubble-own" : "chat-bubble-other"}`}
            >
              {message.content}
            </div>

            {/* Timestamp */}
            {message.createdAt && (
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--color-text-muted)",
                  paddingLeft: "4px",
                  paddingRight: "4px",
                }}
              >
                {formatTime(message.createdAt)}
              </span>
            )}
          </div>

          {/* ── Admin hover actions ── */}
          {showAdminActions && hovered && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                alignSelf: "center",
              }}
            >
              {/* Hide */}
              <Tooltip title="Hide message" placement="right">
                <Popconfirm
                  title="Hide message?"
                  description="The message will be hidden from all users."
                  onConfirm={() => onHide?.(message.senderId, message.content)}
                  okText="Hide"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                  placement="right"
                >
                  <button
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border-md)",
                      background: "var(--color-card-high)",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-accent-red)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-border-md)";
                    }}
                  >
                    <EyeInvisibleOutlined />
                  </button>
                </Popconfirm>
              </Tooltip>

              {/* Ban */}
              <Tooltip title="Ban user from chat" placement="right">
                <button
                  onClick={() => setBanModalOpen(true)}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border-md)",
                    background: "var(--color-card-high)",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-accent-yellow)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-border-md)";
                  }}
                >
                  <StopOutlined />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* ── Ban duration modal ── */}
        <Modal
          open={banModalOpen}
          title={
            <span style={{ color: "var(--color-text-primary)" }}>
              Ban <strong>{message.senderName}</strong> from chat
            </span>
          }
          okText={`Ban - ${selectedLabel}`}
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
          onOk={handleBanConfirm}
          onCancel={() => setBanModalOpen(false)}
          centered
        >
          <p
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            Select duration:
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {BAN_OPTIONS.map((opt) => {
              const isPermanent = opt.minutes === PERMANENT_BAN_MINUTES;
              const isSelected = selectedMinutes === opt.minutes;

              return (
                <button
                  key={opt.minutes}
                  onClick={() => setSelectedMinutes(opt.minutes)}
                  style={{
                    padding: "8px 4px",
                    borderRadius: "8px",
                    border: isSelected
                      ? isPermanent
                        ? "1px solid var(--color-accent-red)"
                        : "1px solid var(--color-gold-border)"
                      : "1px solid var(--color-border-md)",
                    background: isSelected
                      ? isPermanent
                        ? "rgba(248,113,113,0.1)"
                        : "var(--color-gold-subtle)"
                      : "var(--color-card-high)",
                    color: isSelected
                      ? isPermanent
                        ? "var(--color-accent-red)"
                        : "#fed469"
                      : "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 400,
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Modal>
      </>
    );
  },
);

ChatMessageItem.displayName = "ChatMessageItem";

export default ChatMessageItem;

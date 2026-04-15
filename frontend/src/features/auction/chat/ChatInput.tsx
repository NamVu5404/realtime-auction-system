import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Input, Button, Tooltip, Popover, InputRef } from "antd";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import { useState, useRef, KeyboardEvent } from "react";

const MAX_LENGTH = 200;
const RATE_LIMIT_MS = 2000;

interface ChatInputProps {
  onSend: (content: string) => void;
  /** True when the WebSocket is connected AND the auction is live */
  disabled: boolean;
  /** False when user is not logged in — input locked with a login prompt */
  isAuthenticated: boolean;
}

/**
 * Chat input bar with frontend validation:
 * - Disabled when not authenticated or WS not connected
 * - 500-char limit with live counter (turns red at 80%)
 * - 2-second client-side rate limit to mirror backend throttle
 */
const ChatInput = ({ onSend, disabled, isAuthenticated }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const lastSentAt = useRef<number>(0);
  const inputRef = useRef<InputRef>(null);

  const charCount = value.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isLocked = !isAuthenticated || disabled || isCoolingDown || isOverLimit;

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLocked) return;

    const now = Date.now();
    const elapsed = now - lastSentAt.current;

    if (elapsed < RATE_LIMIT_MS) {
      // Still in cooldown — ignore silently (button is already disabled)
      return;
    }

    onSend(trimmed);
    setValue("");
    lastSentAt.current = now;

    // Visual cooldown indicator for the send button
    setIsCoolingDown(true);
    setTimeout(() => setIsCoolingDown(false), RATE_LIMIT_MS);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const input = inputRef.current?.input;
    if (!input) {
      setValue((prev) => prev + emojiData.emoji);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setValue(before + emojiData.emoji + after);

    // Close picker and refocus input after a short delay
    setShowEmojiPicker(false);
    setTimeout(() => {
      input.focus();
      const newPos = start + emojiData.emoji.length;
      input.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
    if (!isAuthenticated) return "Sign in to join the chat";
    if (isCoolingDown) return "Please wait a moment...";
    if (disabled) return "Chat unavailable";
    return "Type a message...";
  };

  const charCountColor = () => {
    if (isOverLimit) return "var(--color-accent-red)";
    if (charCount > MAX_LENGTH * 0.8) return "var(--color-accent-yellow)";
    return "var(--color-text-muted)";
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border)",
        background: "rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Char counter — only shows when user starts typing */}
      {charCount > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "4px 12px 0",
            fontSize: "11px",
            color: charCountColor(),
            transition: "color 0.2s ease",
          }}
        >
          {charCount}/{MAX_LENGTH}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px 12px 12px",
          alignItems: "center",
        }}
      >
        <Popover
          content={
            <EmojiPicker
              theme={Theme.DARK}
              onEmojiClick={onEmojiClick}
              lazyLoadEmojis={true}
              skinTonesDisabled
              searchPlaceHolder="Search emojis..."
              width={300}
              height={400}
            />
          }
          trigger="click"
          open={showEmojiPicker}
          onOpenChange={setShowEmojiPicker}
          placement="topRight"
          styles={{ container: { padding: 0 } }}
        >
          <Button
            type="text"
            icon={<SmileOutlined style={{ fontSize: "20px", opacity: 0.7 }} />}
            style={{
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
            disabled={!isAuthenticated || disabled}
          />
        </Popover>

        <Input
          id="chat-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={!isAuthenticated || disabled}
          maxLength={
            MAX_LENGTH + 10
          } /* Let them type slightly over so they see the counter turn red */
          autoComplete="off"
          style={{
            flex: 1,
            fontSize: "13px",
            height: "40px",
            borderColor: isOverLimit ? "var(--color-accent-red)" : undefined,
            transition: "border-color 0.2s ease",
          }}
        />

        <Tooltip
          title={
            isCoolingDown
              ? "Sending too fast - wait a moment"
              : isOverLimit
                ? "Message too long"
                : undefined
          }
        >
          <Button
            id="chat-send-btn"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={isLocked || !value.trim()}
            style={{
              width: "40px",
              height: "40px",
              flexShrink: 0,
              transition: "opacity 0.2s ease",
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default ChatInput;

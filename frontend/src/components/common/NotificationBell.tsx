import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  List,
  message,
  Popover,
  Typography,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../../api/notificationApi";
import {
  Notification,
  useNotificationStore,
} from "../../store/useNotificationStore";

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;

/**
 * Get color and icon based on notification title keywords as a fallback
 * since type was removed from the DTO.
 */
const getNotifMeta = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("hủy") || t.includes("từ chối") || t.includes("khóa")) {
    return { color: "#ff4d4f", icon: <CloseCircleOutlined /> };
  }
  if (
    t.includes("thắng") ||
    t.includes("phê duyệt") ||
    t.includes("chấp thuận")
  ) {
    return { color: "#52c41a", icon: <CheckCircleOutlined /> };
  }
  if (
    t.includes("vượt giá") ||
    t.includes("bắt đầu") ||
    t.includes("kết thúc")
  ) {
    return { color: "#faad14", icon: <WarningOutlined /> };
  }
  return { color: "#1890ff", icon: <BellOutlined /> };
};

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [visible, setVisible] = useState(false);

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => {
      message.error(error.message);
    },
  });

  const handleNotifClick = (notif: Notification) => {
    markAsRead(notif.id);
    setVisible(false);
    if (notif.redirectUrl) {
      navigate(notif.redirectUrl);
    }
  };

  const content = (
    <div
      style={{
        width: 380,
        maxHeight: 600,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-border-md)",
        }}
      >
        <Title
          level={5}
          style={{
            margin: 0,
            color: "var(--color-text-primary)",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          Thông báo
        </Title>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={() => markAllAsReadMutation.mutate()}
            loading={markAllAsReadMutation.isPending}
            style={{
              padding: 0,
              color: "var(--color-gold-start)",
              height: "auto",
              fontSize: "12px",
              fontWeight: 500,
            }}
            className="hover:brightness-110"
          >
            Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>
      <div
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          flex: 1,
          padding: "4px 0",
        }}
        className="notification-list-container"
      >
        <List
          dataSource={notifications.slice(0, 5)}
          locale={{
            emptyText: (
              <Empty
                description="Không có thông báo mới nào"
                style={{ padding: "24px 0" }}
              />
            ),
          }}
          renderItem={(notif) => {
            const { color, icon } = getNotifMeta(notif.title);
            return (
              <List.Item
                onClick={() => handleNotifClick(notif)}
                style={{
                  cursor: "pointer",
                  padding: "10px 16px",
                  transition: "all 0.2s",
                  backgroundColor: notif.isRead
                    ? "transparent"
                    : "var(--color-gold-subtle)",
                  borderLeft: notif.isRead
                    ? "3px solid transparent"
                    : "3px solid var(--color-gold-start)",
                }}
                className="hover:bg-[rgba(255,255,255,0.03)]"
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={icon}
                      style={{
                        backgroundColor: `${color}15`,
                        color: color,
                        border: `1px solid ${color}30`,
                      }}
                    />
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <Text
                        strong={!notif.isRead}
                        style={{ fontSize: "13px", color: "#fff" }}
                      >
                        {notif.title}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                      >
                        {dayjs(notif.createdAt).fromNow()}
                      </Text>
                    </div>
                  }
                  description={
                    <Text
                      type={notif.isRead ? "secondary" : undefined}
                      style={{
                        fontSize: "12px",
                        color: notif.isRead
                          ? "rgba(255,255,255,0.45)"
                          : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {notif.content}
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>
      <div
        style={{
          padding: "10px",
          textAlign: "center",
          borderTop: "1px solid var(--color-border-md)",
        }}
      >
        <Button
          type="link"
          size="small"
          block
          onClick={() => {
            setVisible(false);
            // Context-aware navigation
            if (window.location.pathname.startsWith("/admin")) {
              navigate("/admin/notifications");
            } else if (window.location.pathname.startsWith("/seller")) {
              navigate("/seller/notifications");
            } else {
              navigate("/account/notifications");
            }
          }}
          style={{ color: "var(--color-gold-start)", fontWeight: 500 }}
          className="hover:brightness-110"
        >
          Xem tất cả thông báo
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      overlayClassName="notification-popover"
      overlayStyle={{ padding: 0 }}
    >
      <Badge
        count={unreadCount}
        overflowCount={99}
        size="small"
        offset={[-2, 6]}
        styles={{
          indicator: {
            backgroundColor: "var(--color-gold-start)",
            color: "var(--color-text-on-gold)",
            boxShadow: "0 0 10px var(--color-gold-glow)",
          },
        }}
      >
        <Button
          type="text"
          icon={
            <BellOutlined
              style={{
                fontSize: "21px",
                color: visible
                  ? "var(--color-gold-start)"
                  : "var(--color-text-secondary)",
              }}
            />
          }
          className="flex items-center justify-center hover:bg-[rgba(254,212,105,0.1)]"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            color: visible
              ? "var(--color-gold-start)"
              : "var(--color-text-secondary)",
            background: visible ? "rgba(254,212,105,0.08)" : "transparent",
          }}
        />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;

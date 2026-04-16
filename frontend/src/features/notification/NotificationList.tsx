import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Empty,
  List,
  message,
  Pagination,
  Space,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { notificationApi } from "../../api/notificationApi";
import {
  Notification,
  useNotificationStore,
} from "../../store/useNotificationStore";

dayjs.extend(relativeTime);
const { Title, Text, Paragraph } = Typography;

const getNotifMeta = (title: string) => {
  const t = title.toLowerCase();
  if (
    t.includes("hủy") ||
    t.includes("từ chối") ||
    t.includes("khóa") ||
    t.includes("thu hồi")
  ) {
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

export interface NotificationListProps {
  /**
   * When provided, renders the page title row (with "Đọc tất cả / Xóa tất cả"
   * action buttons) above the list — same as the original NotificationsPage.
   * Omit this prop when embedding the component inside another page's <Card>.
   */
  title?: string;
}

const NotificationList: React.FC<NotificationListProps> = ({ title }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 20);
  const pageSize = 20;
  const queryClient = useQueryClient();
  const { markAsRead: markAsReadStore, markAllAsRead: markAllAsReadStore } =
    useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationApi.getNotifications(page, pageSize),
  });

  const handlePageChange = (p: number) => {
    setSearchParams({ page: p.toString() });
  };

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: (data, id) => {
      markAsReadStore(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: (data) => {
      markAllAsReadStore();
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: notificationApi.deleteAll,
    onSuccess: (data) => {
      const { clearNotifications } = useNotificationStore.getState();
      clearNotifications();
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  const handleNotifClick = (notif: Notification) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.redirectUrl) {
      navigate(notif.redirectUrl);
    }
  };

  return (
    <div className="account-table-wrapper">
      {/* Title row + action buttons — only rendered when a title is provided */}
      {title && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <Title
            level={2}
            style={{ color: "#fff", margin: 0, fontSize: "24px" }}
          >
            {title}
          </Title>

          <Space>
            <Button
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
              disabled={!data?.data || !data.data.some((n) => !n.isRead)}
              type="primary"
            >
              Read all
            </Button>
            <Tooltip title="Delete all read notifications">
              <Button
                danger
                onClick={() => deleteAllMutation.mutate()}
                loading={deleteAllMutation.isPending}
                disabled={!data?.data || data.data.length === 0}
              >
                Delete all
              </Button>
            </Tooltip>
          </Space>
        </div>
      )}

      <List
        loading={isLoading}
        dataSource={data?.data || []}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No notifications yet"
              style={{ padding: "60px 0" }}
            />
          ),
        }}
        renderItem={(notif) => {
          const { color, icon } = getNotifMeta(notif.title);
          return (
            <List.Item
              className={`transition-all duration-200 hover:bg-[rgba(255,255,255,0.02)] ${!notif.isRead ? "bg-[rgba(254,212,105,0.03)]" : ""}`}
              style={{
                padding: "20px 0",
                borderBottom: "1px solid var(--color-border-subtle)",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => handleNotifClick(notif)}
              actions={[
                <Button
                  type="text"
                  danger
                  icon={
                    <DeleteOutlined
                      style={{ color: "var(--color-accent-red)" }}
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(notif.id);
                  }}
                  style={{ color: "var(--color-accent-red)" }}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={38}
                    icon={icon}
                    style={{
                      backgroundColor: `${color}15`,
                      color: color,
                      border: `1px solid ${color}30`,
                    }}
                  />
                }
                title={
                  <Space
                    align="center"
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Space>
                      <Text strong style={{ color: "#fff", fontSize: "14px" }}>
                        {notif.title}
                      </Text>
                      {!notif.isRead && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#1890ff",
                            boxShadow: "0 0 6px #1890ff",
                            marginLeft: "8px",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      {dayjs(notif.createdAt).format("HH:mm, DD/MM/YYYY")}
                    </Text>
                  </Space>
                }
                description={
                  <Paragraph
                    style={{
                      color: notif.isRead
                        ? "rgba(255,255,255,0.45)"
                        : "rgba(255,255,255,0.85)",
                      margin: "2px 0 0 0",
                      fontSize: "13px",
                    }}
                  >
                    {notif.content}
                  </Paragraph>
                }
              />
            </List.Item>
          );
        }}
      />

      {data && data.total > pageSize && (
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Pagination
            current={page}
            total={data.total}
            pageSize={pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationList;

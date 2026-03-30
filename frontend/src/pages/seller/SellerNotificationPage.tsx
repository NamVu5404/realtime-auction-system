import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Space, Tooltip, message } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../../api/notificationApi";
import NotificationList from "../../features/notification/NotificationList";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";

const SellerNotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { markAllAsRead: markAllAsReadStore } = useNotificationStore();

  useEffect(() => {
    // Redirect to home if not a seller
    if (user && !user.roles?.includes("SELLER")) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data } = useQuery({
    queryKey: ["notifications", 1],
    queryFn: () => notificationApi.getNotifications(1, 10),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      markAllAsReadStore();
      message.success("Tất cả thông báo đã được đánh dấu là đã đọc");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: notificationApi.deleteAll,
    onSuccess: () => {
      const { clearNotifications } = useNotificationStore.getState();
      clearNotifications();
      message.success("Đã xóa tất cả thông báo");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Seller Notifications
        </h1>

        <Space>
          <Button
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isPending}
            disabled={!data?.data || !data.data.some((n) => !n.isRead)}
            type="primary"
          >
            Đọc tất cả
          </Button>
          <Tooltip title="Xóa tất cả thông báo đã đọc">
            <Button
              danger
              onClick={() => deleteAllMutation.mutate()}
              loading={deleteAllMutation.isPending}
              disabled={!data?.data || data.data.length === 0}
            >
              Xóa tất cả
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Card>
        <NotificationList />
      </Card>
    </div>
  );
};

export default SellerNotificationPage;

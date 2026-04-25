import {
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Empty, Pagination, Spin, Tag, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { UserAuditResponse } from "../../api/types";
import userApi from "../../api/userApi";

const { Title, Text } = Typography;

/**
 * Create Timeline Item Config (adapted from AccountTrackingDrawer)
 */
const createTimelineItem = (tracking: UserAuditResponse) => {
  const { actionType, details, createdAt } = tracking;
  const formattedTime = dayjs(createdAt).format("DD/MM/YYYY HH:mm:ss");

  const getIconAndColor = () => {
    if (actionType === "FRAUD" || details?.fraudType || details?.bidId) {
      return {
        icon: <AlertOutlined />,
        color: "red",
        label: "FRAUD",
      };
    }
    if (actionType === "BLOCKED") {
      return {
        icon: <LockOutlined />,
        color: "volcano",
        label: "BLOCKED",
      };
    }
    if (actionType === "UNBLOCKED") {
      return {
        icon: <UnlockOutlined />,
        color: "green",
        label: "UNBLOCKED",
      };
    }
    if (actionType === "SELLER_ROLE_REVOKED") {
      return {
        icon: <UserDeleteOutlined />,
        color: "red",
        label: "SELLER ROLE REVOKED",
      };
    }
    if (actionType === "SELLER_REJECTED") {
      return {
        icon: <CloseCircleOutlined />,
        color: "red",
        label: "SELLER REJECTED",
      };
    }
    if (actionType === "SELLER_APPROVED") {
      return {
        icon: <CheckCircleOutlined />,
        color: "green",
        label: "SELLER APPROVED",
      };
    }
    if (actionType === "BAN_CHAT") {
      return {
        icon: <LockOutlined />,
        color: "red",
        label: "BAN CHAT",
      };
    }
    if (actionType === "UNBAN_CHAT") {
      return {
        icon: <UnlockOutlined />,
        color: "green",
        label: "UNBAN CHAT",
      };
    }
    return {
      icon: <CheckCircleOutlined />,
      color: "blue",
      label: actionType,
    };
  };

  const { icon, color, label } = getIconAndColor();

  return {
    color,
    icon: icon,
    content: (
      <>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: "#9ca3af", fontSize: "12px" }}>
            {formattedTime}
          </span>
        </div>
        <Card
          size="small"
          style={{
            backgroundColor: "#191B24",
            borderColor: "#3f3f46",
            marginBottom: "16px",
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tag color={color}>{label}</Tag>
            </div>
          }
        >
          <div style={{ width: "100%" }}>
            {details && Object.keys(details).length > 0 ? (
              <div>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Details:
                </span>
                <pre
                  style={{
                    backgroundColor: "#191B24",
                    borderRadius: "4px",
                    padding: "12px",
                    border: "1px solid #52525b",
                    overflow: "auto",
                    marginTop: "8px",
                    marginBottom: 0,
                    maxHeight: "300px",
                  }}
                >
                  <code
                    style={{
                      color: "#e5e7eb",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {JSON.stringify(details, null, 2)}
                  </code>
                </pre>
              </div>
            ) : (
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                No details available
              </span>
            )}
          </div>
        </Card>
      </>
    ),
  };
};

const SecurityLogsPage = () => {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["my-security-logs", page],
    queryFn: () => userApi.getMyAccountAudit(page, pageSize),
  });

  return (
    <div>
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "24px", fontSize: "24px" }}
      >
        Security Logs
      </Title>

      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <Spin />
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <Empty
          description="No security logs found"
          style={{ marginTop: "60px" }}
        />
      ) : (
        <div>
          <Timeline
            items={data.data.map((tracking) => createTimelineItem(tracking))}
          />

          {data.totalElements > pageSize && (
            <div
              style={{
                display: "flex",
                justifyContent: "end",
              }}
            >
              <Pagination
                current={page}
                pageSize={pageSize}
                total={data.totalElements}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityLogsPage;

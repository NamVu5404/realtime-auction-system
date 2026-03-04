import {
  AlertOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Drawer, Empty, Pagination, Skeleton, Tag, Timeline } from "antd";
import dayjs from "dayjs";
import adminApi from "../../api/adminApi";
import { PageResponse, User, UserAuditResponse } from "../../api/types";

interface AccountTrackingDrawerProps {
  visible: boolean;
  userId: number | null;
  user: User | null;
  onClose: () => void;
  page: number;
  onPageChange: (page: number) => void;
}

/**
 * Create Timeline Item Config
 */
const createTimelineItem = (tracking: UserAuditResponse) => {
  const { actionType, details, createdAt } = tracking;

  // Format timestamp to local time
  const formattedTime = dayjs(createdAt).format("DD/MM/YYYY HH:mm:ss");

  // Determine icon and color based on action type
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
            {/* Display details as formatted JSON */}
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

/**
 * Account Tracking Drawer Component
 */
export const AccountTrackingDrawer = ({
  visible,
  userId,
  user,
  onClose,
  page,
  onPageChange,
}: AccountTrackingDrawerProps) => {
  // Fetch tracking data with pagination
  // API already unwraps response.data.result, so we get PageResponse directly
  const { data, isLoading, error } = useQuery<PageResponse<UserAuditResponse>>({
    queryKey: ["user-tracking", userId, page],
    queryFn: () => adminApi.getUserAudit(userId!, page, 20),
    enabled: visible && !!userId,
  });

  return (
    <Drawer
      title={
        <div>
          <div
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}
          >
            User Audit Logs
          </div>
          {user?.email && (
            <div
              style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 400 }}
            >
              {user.email}
            </div>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      size={800}
      styles={{
        body: {
          paddingBottom: "60px",
          backgroundColor: "#191B24",
        },
        header: {
          backgroundColor: "#191B24",
          borderBottom: "1px solid #404040",
          color: "#ffffff",
        },
      }}
    >
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <Empty
          description="No tracking history found"
          style={{
            marginTop: "60px",
          }}
        />
      ) : (
        <div style={{ padding: "0 16px" }}>
          {/* Timeline visualization */}
          <Timeline
            items={data.data.map((tracking) => {
              return createTimelineItem(tracking);
            })}
          />

          {/* Pagination */}
          {data && data.totalElements > 20 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #27272a",
              }}
            >
              <Pagination
                current={page}
                pageSize={20}
                total={data.totalElements}
                onChange={onPageChange}
                showSizeChanger={false}
                showTotal={(total, range) => (
                  <span style={{ color: "#9ca3af" }}>
                    {range[0]}-{range[1]} of {total} items
                  </span>
                )}
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default AccountTrackingDrawer;

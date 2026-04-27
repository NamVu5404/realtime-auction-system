import {
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Drawer, Empty, Pagination, Skeleton, Tag } from "antd";
import type { TimelineItemProps } from "antd";
import dayjs from "dayjs";
import adminApi from "../../../api/adminApi";
import {
  AuctionActionType,
  AuctionAuditResponse,
  PageResponse,
} from "../../../api/types";
import AuditTimeline from "../../../components/common/AuditTimeline";

interface AuctionAuditDrawerProps {
  visible: boolean;
  auctionId: number | null;
  auctionTitle?: string;
  onClose: () => void;
  page: number;
  onPageChange: (page: number) => void;
}

/**
 * Get color for action type
 */
const getActionColor = (actionType: AuctionActionType): string => {
  switch (actionType) {
    case AuctionActionType.CREATED:
      return "green";
    case AuctionActionType.UPDATED:
      return "blue";
    case AuctionActionType.START:
      return "cyan";
    case AuctionActionType.END:
      return "purple";
    case AuctionActionType.CANCELLED:
      return "red";
    case AuctionActionType.FRAUD:
      return "orange";
    case AuctionActionType.RESULT:
      return "gold";
    case AuctionActionType.PENDING_REVIEW:
      return "processing";
    case AuctionActionType.AI_REVIEW_APPROVED:
    case AuctionActionType.ADMIN_REVIEW_APPROVED:
      return "success";
    case AuctionActionType.AI_REVIEW_REJECTED:
    case AuctionActionType.ADMIN_REVIEW_REJECTED:
      return "error";
    case AuctionActionType.AI_REVIEW_FALLBACK:
      return "warning";
    default:
      return "default";
  }
};

/**
 * Get icon for action type
 */
const getActionIcon = (actionType: AuctionActionType) => {
  switch (actionType) {
    case AuctionActionType.CREATED:
      return <PlusCircleOutlined />;
    case AuctionActionType.UPDATED:
      return <EditOutlined />;
    case AuctionActionType.START:
      return <CheckCircleOutlined />;
    case AuctionActionType.END:
      return <SettingOutlined />;
    case AuctionActionType.CANCELLED:
      return <AlertOutlined />;
    case AuctionActionType.PENDING_REVIEW:
      return <SafetyCertificateOutlined />;
    case AuctionActionType.AI_REVIEW_APPROVED:
    case AuctionActionType.AI_REVIEW_FALLBACK:
      return <RobotOutlined />;
    case AuctionActionType.AI_REVIEW_REJECTED:
      return <CloseCircleOutlined />;
    case AuctionActionType.ADMIN_REVIEW_APPROVED:
    case AuctionActionType.ADMIN_REVIEW_REJECTED:
      return <UserOutlined />;
    default:
      return <FileTextOutlined />;
  }
};

/**
 * Render timeline item for audit log
 */
const renderAuditItem = (log: AuctionAuditResponse): TimelineItemProps => {
  const formattedTime = dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss");
  const color = getActionColor(log.actionType);
  const icon = getActionIcon(log.actionType);
  const actor = log?.updatedBy || "System";

  return {
    color,
    dot: icon,
    children: (
      <>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: "#9ca3af", fontSize: "12px" }}>
            {formattedTime}
          </span>
        </div>
        <Card
          size="small"
          style={{
            backgroundColor: "var(--color-bg)",
            borderColor: "#3f3f46",
            marginBottom: "16px",
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tag color={color}>{log.actionType}</Tag>
            </div>
          }
        >
          <div style={{ width: "100%" }}>
            {/* Actor */}
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                Actor:{" "}
              </span>
              <span
                style={{
                  color: actor === "System" ? "#22d3ee" : "#fbbf24",
                  fontWeight: 600,
                }}
              >
                {actor}
              </span>
            </div>

            {/* Details as JSON */}
            {log.details && Object.keys(log.details).length > 0 ? (
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
                    {JSON.stringify(log.details, null, 2)}
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
 * AuctionAuditDrawer Component
 *
 * Displays audit/tracking logs for an auction including admin actions and system events.
 */
export const AuctionAuditDrawer = ({
  visible,
  auctionId,
  auctionTitle,
  onClose,
  page,
  onPageChange,
}: AuctionAuditDrawerProps) => {
  const { data, isLoading } = useQuery<PageResponse<AuctionAuditResponse>>({
    queryKey: ["auction-audit", auctionId, page],
    queryFn: () => adminApi.getAuctionAudit(auctionId!, page, 20),
    enabled: visible && !!auctionId,
  });

  return (
    <Drawer
      title={
        <div>
          <div
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}
          >
            Auction Audit Logs
          </div>
          {auctionTitle && (
            <div
              style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 400 }}
            >
              {auctionTitle}
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
          paddingBottom: "32px",
          backgroundColor: "var(--color-card)",
        },
        header: {
          backgroundColor: "var(--color-card)",
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
          <AuditTimeline
            data={data.data}
            isLoading={isLoading}
            renderItem={renderAuditItem}
          />

          {data && data.totalElements > 20 && (
            <div
              style={{
                display: "flex",
                justifyContent: "end",
                marginTop: "16px",
              }}
            >
              <Pagination
                current={page}
                pageSize={20}
                total={data.totalElements}
                onChange={onPageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default AuctionAuditDrawer;

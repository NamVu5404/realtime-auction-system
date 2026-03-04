import {
  AlertOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Card, Drawer, Tag } from "antd";
import type { TimelineItemProps } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import adminApi from "../../../api/adminApi";
import { AuctionActionType, AuctionAuditResponse } from "../../../api/types";
import AuditTimeline from "../../../components/common/AuditTimeline";

interface AuctionAuditDrawerProps {
  visible: boolean;
  auctionId: number | null;
  auctionTitle?: string;
  onClose: () => void;
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
            backgroundColor: "#191B24",
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
}: AuctionAuditDrawerProps) => {
  const [auditLogs, setAuditLogs] = useState<AuctionAuditResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch audit logs when drawer opens
  useEffect(() => {
    if (visible && auctionId) {
      setIsLoading(true);
      adminApi
        .getAuctionAudit(auctionId)
        .then((response) => {
          setAuditLogs(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch auction audit logs:", error);
          setIsLoading(false);
        });
    } else {
      setAuditLogs([]);
    }
  }, [visible, auctionId]);

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
      <AuditTimeline
        data={auditLogs}
        isLoading={isLoading}
        renderItem={renderAuditItem}
      />
    </Drawer>
  );
};

export default AuctionAuditDrawer;

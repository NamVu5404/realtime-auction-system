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
import { AuditLog, getAuctionAuditLogs } from "../../../api/adminMockApi";
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
const getActionColor = (actionType: string): string => {
  const lowerAction = actionType.toLowerCase();

  if (lowerAction.includes("created") || lowerAction.includes("uploaded")) {
    return "green";
  }
  if (
    lowerAction.includes("edited") ||
    lowerAction.includes("updated") ||
    lowerAction.includes("adjusted")
  ) {
    return "blue";
  }
  if (lowerAction.includes("status")) {
    return "purple";
  }
  if (lowerAction.includes("auto") || lowerAction.includes("system")) {
    return "cyan";
  }
  if (lowerAction.includes("cancelled") || lowerAction.includes("stopped")) {
    return "red";
  }

  return "default";
};

/**
 * Get icon for action type
 */
const getActionIcon = (actionType: string) => {
  const lowerAction = actionType.toLowerCase();

  if (lowerAction.includes("created")) {
    return <PlusCircleOutlined />;
  }
  if (lowerAction.includes("edited") || lowerAction.includes("updated")) {
    return <EditOutlined />;
  }
  if (lowerAction.includes("status")) {
    return <SettingOutlined />;
  }
  if (lowerAction.includes("auto") || lowerAction.includes("system")) {
    return <CheckCircleOutlined />;
  }
  if (lowerAction.includes("cancelled") || lowerAction.includes("stopped")) {
    return <AlertOutlined />;
  }

  return <FileTextOutlined />;
};

/**
 * Render timeline item for audit log
 */
const renderAuditItem = (log: AuditLog): TimelineItemProps => {
  const formattedTime = dayjs(log.timestamp).format("HH:mm DD/MM/YYYY");
  const color = getActionColor(log.actionType);
  const icon = getActionIcon(log.actionType);

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
            backgroundColor: "#18181b",
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
                  color: log.actor === "System" ? "#22d3ee" : "#fbbf24",
                  fontWeight: 600,
                }}
              >
                {log.actor}
              </span>
            </div>

            {/* Details */}
            {log.details && (
              <div>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Details:
                </span>
                <p
                  style={{
                    color: "#e5e7eb",
                    fontSize: "13px",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  {log.details}
                </p>
              </div>
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch audit logs when drawer opens
  useEffect(() => {
    if (visible && auctionId) {
      setIsLoading(true);
      getAuctionAuditLogs(auctionId)
        .then((logs) => {
          setAuditLogs(logs);
          setIsLoading(false);
        })
        .catch(() => {
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
          backgroundColor: "#0a0a0a",
        },
        header: {
          backgroundColor: "#181818",
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

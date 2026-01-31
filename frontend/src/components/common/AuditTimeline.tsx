import { Empty, Skeleton, Timeline } from "antd";
import type { TimelineItemProps } from "antd";

/**
 * Props for AuditTimeline component
 */
interface AuditTimelineProps<T> {
  data: T[];
  isLoading: boolean;
  renderItem: (item: T) => TimelineItemProps;
}

/**
 * AuditTimeline Component
 *
 * A reusable component to render tracking/audit logs using Ant Design Timeline.
 * This component is generic and can be used for both User Tracking and Auction Audit logs.
 *
 * @template T - Type of data items in the timeline
 * @param data - Array of log objects
 * @param isLoading - Loading state
 * @param renderItem - Function to render the content of each timeline item
 */
export const AuditTimeline = <T,>({
  data,
  isLoading,
  renderItem,
}: AuditTimelineProps<T>) => {
  // Loading state
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Empty
        description="No audit logs found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{
          marginTop: "60px",
        }}
      />
    );
  }

  // Render timeline
  return (
    <div
      style={{
        padding: "0 16px",
      }}
    >
      <Timeline items={data.map((item) => renderItem(item))} />
    </div>
  );
};

export default AuditTimeline;

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Drawer,
  Tabs,
  Tag,
  Table,
  Space,
  Avatar,
  Button,
  Spin,
  Empty,
  Descriptions,
  Image as AntImage,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Auction, AuctionStatus, BidUpdateMessage } from "../../api/types";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { useAuctionWebsocket } from "../../hooks/useAuctionWebsocket";
import { getStatusColor } from "../../utils/statusUtils";
import dayjs from "dayjs";

interface AuctionDetailDrawerProps {
  auction?: Auction;
  visible: boolean;
  onClose: () => void;
}

interface BidLog {
  id: string;
  bidderName: string;
  bidderAvatar?: string;
  amount: number;
  timestamp: string;
}

export const AuctionDetailDrawer = ({
  auction,
  visible,
  onClose,
}: AuctionDetailDrawerProps) => {
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const websocketRef = useRef<any>(null);

  // ✅ FIX: Stabilize auctionId with useMemo
  // Only change when actual ID value or connection status changes
  const stableAuctionId = useMemo(
    () =>
      visible && auction?.status === AuctionStatus.LIVE ? auction?.id || 0 : 0,
    [visible, auction?.id, auction?.status],
  );

  // ✅ FIX: Stabilize callback so hook doesn't recreate on every render
  const onBidUpdate = useCallback((message: BidUpdateMessage) => {
    const newBid: BidLog = {
      id: `${message.highestBidderId}-${Date.now()}`,
      bidderName: message.highestBidderName || "Anonymous Bidder",
      bidderAvatar: undefined,
      amount: message.currentPrice,
      timestamp: message.timestamp,
    };
    setBidLogs((prev) => [newBid, ...prev]);
  }, []);

  const { isConnected } = useAuctionWebsocket({
    auctionId: stableAuctionId,
    onBidUpdate,
  });

  // Reset bid logs when drawer closes or auction changes
  useEffect(() => {
    if (!visible) {
      setBidLogs([]);
    } else if (auction?.id) {
      // Load initial bid logs - in real app, fetch from API
      setIsLoadingLogs(true);
      // Simulate loading
      setTimeout(() => {
        // Mock initial bids (in reverse chronological order - newest first)
        const startPrice = auction.startPrice || 0;
        setBidLogs([
          {
            id: "1",
            bidderName: "Bidder A",
            amount: auction.currentPrice,
            timestamp: dayjs().subtract(2, "minutes").toISOString(),
          },
          {
            id: "2",
            bidderName: "Bidder B",
            amount: startPrice + 5000,
            timestamp: dayjs().subtract(8, "minutes").toISOString(),
          },
          {
            id: "3",
            bidderName: "Bidder C",
            amount: startPrice + 2000,
            timestamp: dayjs().subtract(15, "minutes").toISOString(),
          },
        ]);
        setIsLoadingLogs(false);
      }, 500);
    }
  }, [visible, auction?.id]);

  const bidColumns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: string) => formatDateTime(timestamp),
      width: "30%",
    },
    {
      title: "Bidder",
      dataIndex: "bidderName",
      key: "bidderName",
      render: (name: string, record: BidLog) => (
        <Space>
          {record.bidderAvatar && (
            <Avatar src={record.bidderAvatar} size="small" />
          )}
          <span className="text-white">{name}</span>
        </Space>
      ),
      width: "40%",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <span className="text-green-400 font-semibold">
          {formatCurrency(amount)}
        </span>
      ),
      width: "30%",
    },
  ];

  if (!auction) {
    return null;
  }

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <span>{auction.title}</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="ml-auto"
          />
        </div>
      }
      onClose={onClose}
      open={visible}
      size={720}
      styles={{
        body: {
          backgroundColor: "#1a1a1a",
          padding: "24px",
        },
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: "Overview",
            children: (
              <div className="space-y-6">
                {/* Gallery */}
                {auction.image && (
                  <div className="bg-zinc-900 rounded p-4">
                    <AntImage
                      src={auction.image}
                      alt={auction.title}
                      style={{
                        maxHeight: "300px",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                {/* Basic Info */}
                <Descriptions
                  column={1}
                  size="small"
                  className="bg-zinc-900 rounded"
                  styles={{
                    label: { color: "#9ca3af", fontWeight: 600 },
                    content: { color: "#fff" },
                  }}
                >
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(auction.status)}>
                      {auction.status}
                    </Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Creator">
                    <Space>
                      {auction.seller?.avatarUrl && (
                        <Avatar src={auction.seller.avatarUrl} />
                      )}
                      <span className="text-white">
                        {auction.seller?.name || "Unknown"}
                      </span>
                    </Space>
                  </Descriptions.Item>

                  <Descriptions.Item label="Description">
                    <p className="text-gray-300 mt-2">{auction.description}</p>
                  </Descriptions.Item>

                  <Descriptions.Item label="Start Price">
                    <span className="text-green-400 font-semibold">
                      {formatCurrency(auction.startPrice)}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item label="Current Price">
                    <span className="text-yellow-400 font-semibold text-lg">
                      {formatCurrency(auction.currentPrice)}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item label="Minimum Step">
                    <span className="text-blue-400">
                      {formatCurrency(auction.minStep)}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item label="Start Time">
                    <span className="text-gray-300">
                      {formatDateTime(auction.startTime)}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item label="End Time">
                    <span className="text-gray-300">
                      {formatDateTime(auction.endTime)}
                    </span>
                  </Descriptions.Item>

                  {auction.status === AuctionStatus.LIVE && (
                    <Descriptions.Item label="Connection Status">
                      <Space>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isConnected ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm">
                          {isConnected
                            ? "Connected (Live Updates)"
                            : "Connecting..."}
                        </span>
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            ),
          },
          {
            key: "logs",
            label: "Bid Logs",
            children: (
              <div className="space-y-4">
                {auction.status === AuctionStatus.LIVE && (
                  <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded p-3">
                    <p className="text-sm text-blue-300">
                      Live bidding in progress. New bids appear in real-time.
                    </p>
                  </div>
                )}

                {auction.status === AuctionStatus.ENDED && (
                  <div className="bg-gray-900 bg-opacity-20 border border-gray-500 rounded p-3">
                    <p className="text-sm text-gray-300">
                      📊 Final bid history for this auction.
                    </p>
                  </div>
                )}

                <Spin spinning={isLoadingLogs}>
                  {bidLogs.length > 0 ? (
                    <Table
                      columns={bidColumns}
                      dataSource={bidLogs}
                      rowKey="id"
                      pagination={false}
                      className="bg-zinc-900 rounded"
                      size="small"
                      scroll={{ x: true }}
                    />
                  ) : (
                    <Empty
                      description="No bids yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </Spin>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default AuctionDetailDrawer;

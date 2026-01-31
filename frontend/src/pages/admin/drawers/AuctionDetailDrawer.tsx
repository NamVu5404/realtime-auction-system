import { TrophyOutlined } from "@ant-design/icons";
import {
  Image as AntImage,
  Card,
  Col,
  Drawer,
  Empty,
  Image,
  Row,
  Spin,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { auctionApi } from "../../../api/auctionApi"; // Import auctionApi for other uses if any, or remove if unused. Keep for now.
import {
  Auction,
  AuctionStatus,
  AuctionHistoryResponse,
} from "../../../api/types";
import { useAuctionHistory } from "../../../hooks/useAuctions"; // Import hook
import Countdown from "../../../features/auction/Countdown";
import { formatAuctionTime, getTimeRemaining } from "../../../utils/dateUtils";
import { formatCurrency } from "../../../utils/format";
import { getStatusColor } from "../../../utils/statusUtils";

interface AuctionDetailDrawerProps {
  auction?: Auction;
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_IMAGE =
  "https://png.pngtree.com/background/20231030/original/pngtree-courtroom-judgement-dark-wooden-stand-with-gavel-and-auction-hammer-3d-picture-image_5798933.jpg";

export const AuctionDetailDrawer = ({
  auction,
  visible,
  onClose,
}: AuctionDetailDrawerProps) => {
  const [bidLogsPage, setBidLogsPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  // Determine if we should fetch logs
  const shouldFetchLogs =
    visible &&
    !!auction?.id &&
    activeTab === "bid-logs" &&
    (auction.status === AuctionStatus.LIVE ||
      auction.status === AuctionStatus.ENDED);

  // Use TanStack Query hook
  const {
    data: bidLogsData,
    isLoading: isLoadingLogs,
    isFetching: isFetchingLogs,
  } = useAuctionHistory(
    auction?.id || null,
    bidLogsPage,
    20, // fetching 20 items per page
    shouldFetchLogs,
  );

  const bidLogs = bidLogsData?.data || [];

  if (!auction) {
    return null;
  }

  // Determine if Bid Logs tab should be shown
  const showBidLogsTab =
    auction.status === AuctionStatus.LIVE ||
    auction.status === AuctionStatus.ENDED;

  // Find the highest bid (winner) for ENDED auctions

  // Countdown logic
  const timeTilStart = getTimeRemaining(auction.startTime);
  const oneHourMs = 3600000;
  const shouldShowCountdown =
    auction.status === AuctionStatus.LIVE ||
    (auction.status === AuctionStatus.SCHEDULED &&
      timeTilStart > 0 &&
      timeTilStart < oneHourMs);

  const handleCountdownComplete = () => {
    if (auction.status === AuctionStatus.LIVE) {
      message.info("Auction has ended");
    } else if (auction.status === AuctionStatus.SCHEDULED) {
      message.success("Auction is now LIVE!");
    }
  };

  // Bid logs table columns
  const bidColumns: ColumnsType<AuctionHistoryResponse> = [
    {
      title: "Bidder",
      dataIndex: "bidderEmail",
      key: "bidderEmail",
      render: (email: string) => <span className="text-white">{email}</span>,
      width: "35%",
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
      width: "25%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "ACCEPTED") color = "success";
        else if (status === "REJECTED") color = "error";
        else if (status === "FLAGGED") color = "warning";

        return <Tag color={color}>{status}</Tag>;
      },
      width: "20%",
    },
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: string) => (
        <span className="text-gray-300">{formatAuctionTime(timestamp)}</span>
      ),
      width: "20%",
    },
  ];

  // Tab items
  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <div className="space-y-6">
          {/* Section 1: Header - Status & Basic Info */}
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-white m-0">
              {auction.title}
            </h2>
            <Tag
              color={getStatusColor(auction.status)}
              className="text-base px-3 py-1 flex items-center gap-2 m-0 border-0"
            >
              {auction.status}
            </Tag>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Left Column: Image & Description */}
            <div className="space-y-6">
              {/* Product Image */}
              <Card
                className="bg-zinc-900 border-zinc-800 overflow-hidden"
                styles={{ body: { padding: 0 } }}
              >
                <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center">
                  <AntImage
                    src={auction.image || DEFAULT_IMAGE}
                    alt={auction.title}
                    className="object-contain w-full h-full"
                    style={{ maxHeight: "300px" }}
                    classNames={{
                      root: "w-full h-full flex items-center justify-center",
                    }}
                  />
                </div>
              </Card>

              {/* Description */}
              <p className="text-gray-400 m-0 leading-relaxed whitespace-pre-wrap">
                {auction.description || "No description provided."}
              </p>
            </div>

            {/* Right Column: Key Stats & Timeline */}
            <div className="space-y-6">
              {/* Countdown Timer */}
              {shouldShowCountdown && (
                <Card className="bg-zinc-900 border-zinc-800">
                  {auction.status === AuctionStatus.LIVE ? (
                    <Countdown
                      targetTime={auction.endTime}
                      isLive
                      onFinish={handleCountdownComplete}
                    />
                  ) : (
                    <Countdown
                      targetTime={auction.startTime}
                      onFinish={handleCountdownComplete}
                    />
                  )}
                </Card>
              )}

              {/* Price Card */}
              <Card className="bg-zinc-900 border-zinc-800">
                <div className="space-y-6">
                  {/* Current Price - Main Focus */}
                  <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-6 text-center">
                    <div className="text-gray-300 text-sm mb-2">
                      Current Price
                    </div>
                    <div className="text-4xl font-bold text-green-400 drop-shadow-lg">
                      {formatCurrency(auction.currentPrice)}
                    </div>
                  </div>

                  {/* Supporting Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 rounded p-3 text-center">
                      <div className="text-gray-400 text-xs mb-1">
                        Starting Price
                      </div>
                      <div className="text-lg font-bold text-yellow-500">
                        {formatCurrency(auction.startPrice)}
                      </div>
                    </div>
                    <div className="bg-zinc-800/50 rounded p-3 text-center">
                      <div className="text-gray-400 text-xs mb-1">
                        Min Bid Step
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {formatCurrency(auction.minStep)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Timeline Card */}
              <Card className="bg-zinc-900 border-zinc-800">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div>
                      <div className="text-gray-400 text-sm mb-2">
                        Start Time
                      </div>
                      <div className="text-white font-medium">
                        {formatAuctionTime(auction.startTime)}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div>
                      <div className="text-gray-400 text-sm mb-2">End Time</div>
                      <div className="text-white font-medium">
                        {formatAuctionTime(auction.endTime)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Users Info Card */}
              <Card className="bg-zinc-900 border-zinc-800">
                <Row gutter={[32, 16]}>
                  <Col xs={24} sm={12}>
                    <div>
                      <div className="text-gray-400 text-sm mb-3">Seller</div>
                      <div className="flex items-center space-x-3">
                        {auction.seller?.avatarUrl && (
                          <Image
                            src={auction.seller.avatarUrl}
                            alt={auction.seller.name}
                            className="w-10 h-10 rounded-full"
                            preview={false}
                          />
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {auction.seller?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {auction.seller?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                  {auction.highestBidder && (
                    <Col xs={24} sm={12}>
                      <div>
                        <div className="text-gray-400 text-sm mb-3">
                          Highest Bidder
                        </div>
                        {auction.status === AuctionStatus.LIVE ? (
                          <div className="font-semibold text-white">
                            {auction.highestBidder.name}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            {auction.highestBidder?.avatarUrl && (
                              <Image
                                src={auction.highestBidder.avatarUrl}
                                alt={auction.highestBidder.name}
                                className="w-10 h-10 rounded-full"
                                preview={false}
                              />
                            )}
                            <div>
                              <div className="font-medium text-white">
                                {auction.highestBidder?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {auction.highestBidder?.email}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Col>
                  )}
                </Row>
              </Card>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Add Bid Logs tab only if auction is LIVE or ENDED
  if (showBidLogsTab) {
    tabItems.push({
      key: "bid-logs",
      label: "Bid Logs",
      children: (
        <div className="space-y-4">
          {auction.status === AuctionStatus.LIVE && (
            <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded p-3">
              <p className="text-sm text-blue-300 m-0">
                🔴 Live bidding in progress. Bid logs are displayed below.
              </p>
            </div>
          )}

          {auction.status === AuctionStatus.ENDED && (
            <div className="bg-gray-900 bg-opacity-20 border border-gray-500 rounded p-3">
              <p className="text-sm text-gray-300 m-0">
                📊 Final bid history for this auction.
              </p>
            </div>
          )}

          <Spin spinning={isLoadingLogs || isFetchingLogs}>
            {bidLogs.length > 0 ? (
              <Table
                columns={bidColumns}
                dataSource={bidLogs}
                rowKey={(record) => record.timestamp + record.bidderId}
                pagination={{
                  current: bidLogsPage,
                  pageSize: 20,
                  total: bidLogsData?.totalElements || 0,
                  onChange: (page) => setBidLogsPage(page),
                  showSizeChanger: false,
                }}
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
    });
  }

  return (
    <Drawer
      title={null}
      closable={false}
      onClose={onClose}
      open={visible}
      size={1000}
      styles={{
        body: {
          backgroundColor: "#09090b", // zinc-950
          padding: "0",
        },
      }}
      rootClassName="no-scrollbar"
    >
      <div className="flex h-full flex-col">
        {/* Custom Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
          <div className="text-lg font-semibold text-white">
            Auction Details
          </div>
          <div
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors p-2 -mr-2 text-xl leading-none"
          >
            ×
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{
              color: "#ffffff",
            }}
            className="auction-tabs"
          />
        </div>
      </div>
    </Drawer>
  );
};

export default AuctionDetailDrawer;

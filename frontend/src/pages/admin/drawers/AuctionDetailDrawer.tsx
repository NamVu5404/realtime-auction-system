import { WifiOutlined } from "@ant-design/icons";
import {
  Card,
  Col,
  Drawer,
  Empty,
  Image,
  message,
  Row,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";

import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useRef, useState } from "react";
import { auctionApi } from "../../../api/auctionApi";
import {
  Auction,
  AuctionHistoryResponse,
  AuctionStatus,
  BidStatus,
  BidUpdateMessage,
  UserRole,
} from "../../../api/types";
import Countdown from "../../../features/auction/Countdown";
import { useAuctionWebsocket } from "../../../hooks/useAuctionWebsocket";
import { useAuctionHistory } from "../../../hooks/useAuctions";
import { useUIStore } from "../../../store/useUIStore";
import { formatAuctionTime, getTimeRemaining } from "../../../utils/dateUtils";
import { AuctionImageCarousel } from "../../../components/common/AuctionImageCarousel";
import { formatCurrency } from "../../../utils/format";
import { getStatusColor } from "../../../utils/statusUtils";

interface AuctionDetailDrawerProps {
  auction?: Auction;
  visible: boolean;
  onClose: () => void;
}

export const AuctionDetailDrawer = ({
  auction: propAuction,
  visible,
  onClose,
}: AuctionDetailDrawerProps) => {
  const [bidLogsPage, setBidLogsPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const { isMaintenanceMode, setMaintenanceMode } = useUIStore();

  // Local state for auction details to support real-time updates
  const [localAuction, setLocalAuction] = useState<Auction | null>(null);

  // Sync local state when prop changes
  useEffect(() => {
    if (propAuction) {
      setLocalAuction(propAuction);
    }
  }, [propAuction]);

  const auctionId = localAuction?.id || null;

  // Determine if we should fetch logs
  const shouldFetchLogs =
    visible &&
    !!auctionId &&
    activeTab === "bid-logs" &&
    (localAuction?.status === AuctionStatus.LIVE ||
      localAuction?.status === AuctionStatus.ENDED);

  // Use TanStack Query hook
  const {
    data: bidLogsData,
    isLoading: isLoadingLogs,
    isFetching: isFetchingLogs,
  } = useAuctionHistory(
    auctionId,
    bidLogsPage,
    20, // fetching 20 items per page
    shouldFetchLogs,
  );

  // Local state for bid logs to handle real-time updates without refetching
  const [bidLogs, setBidLogs] = useState<AuctionHistoryResponse[]>([]);

  // Sync local state with fetched data
  useEffect(() => {
    if (bidLogsData?.data) {
      setBidLogs(bidLogsData.data);
    }
  }, [bidLogsData]);

  // ✅ Single source of truth for ALL WebSocket state updates
  const onBidUpdate = useCallback((message: BidUpdateMessage) => {
    // Update lastActive whenever a message is received
    setLastActive(Date.now());
    // Reset polling interval on recovery
    setPollingInterval(2000);

    // Update auction price, bidder AND endTime
    setLocalAuction((prev) => {
      if (!prev || prev.id !== message.auctionId) return prev;

      const newEndTime = message.finalEndTime || prev.endTime;

      console.log("[AdminDrawer] onBidUpdate:", {
        oldEndTime: prev.endTime,
        newEndTime,
        finalEndTime: message.finalEndTime,
        extended: message.extended,
      });

      return {
        ...prev,
        currentPrice:
          message.currentPrice || message.amount || prev.currentPrice,
        highestBidder: {
          id:
            message.highestBidderId ||
            message.bidderId ||
            prev.highestBidder?.id ||
            0,
          name:
            message.highestBidderName ||
            prev.highestBidder?.name ||
            "Ng\u01b0\u1eddi \u0111\u1ea5u gi\u00e1",
          email: prev.highestBidder?.email || "",
          role: prev.highestBidder?.role || UserRole.USER,
        },
        endTime: newEndTime,
      };
    });

    // Only update if we are on the first page to avoid confusion
    setBidLogs((prev) => {
      // Check for duplicate updates to be safe
      if (
        prev.some(
          (bid) =>
            bid.timestamp === new Date().toISOString() &&
            bid.amount === (message.currentPrice || message.amount),
        )
      )
        return prev;

      const newBid: AuctionHistoryResponse = {
        bidderId: message.highestBidderId || message.bidderId || 0,
        bidderEmail:
          message.highestBidderName || "Ng\u01b0\u1eddi \u0111\u1ea5u gi\u00e1",
        amount: message.currentPrice || message.amount || 0,
        timestamp: new Date().toISOString(),
        status: "ACCEPTED" as BidStatus,
      };
      return [newBid, ...prev];
    });
  }, []);

  // ✅ Visual notification only — state is already updated by onBidUpdate
  const onTimeExtended = useCallback((_newEndTime: string) => {
    // No state update needed here — onBidUpdate already handles endTime
  }, []);

  // Connect to WebSocket only when drawer is visible and auction is LIVE
  const shouldConnectSocket =
    visible && localAuction?.status === AuctionStatus.LIVE;

  const { isConnected } = useAuctionWebsocket({
    auctionId: shouldConnectSocket && auctionId ? auctionId : 0,
    onBidUpdate,
    onTimeExtended,
  });

  // --- Smart Fallback Logic (Polling) ---
  const [lastActive, setLastActive] = useState<number>(Date.now());
  const [pollingInterval, setPollingInterval] = useState<number>(2000);
  const isFetchingRef = useRef<boolean>(false);
  const lastPollTimeRef = useRef<number>(0);

  useEffect(() => {
    if (
      !localAuction ||
      localAuction.status !== AuctionStatus.LIVE ||
      !auctionId ||
      !visible
    )
      return;

    const silenceDetector = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastActive = now - lastActive;
      const timeSinceLastPoll = now - lastPollTimeRef.current;

      const pollerInterval = isMaintenanceMode ? 5000 : pollingInterval;

      if (
        (timeSinceLastActive > 2000 || isMaintenanceMode) &&
        timeSinceLastPoll >= pollerInterval &&
        !isFetchingRef.current
      ) {
        console.log(
          `Silence/Maintenance detected in Drawer. Polling API (Interval: ${pollerInterval}ms)...`,
        );
        isFetchingRef.current = true;
        lastPollTimeRef.current = now;

        try {
          const apiPrice = await auctionApi.getCurrentPrice(auctionId);
          isFetchingRef.current = false;

          if (isMaintenanceMode) {
            console.log("System recovered from Maintenance Mode!");
            setMaintenanceMode(false);
            setPollingInterval(2000);
          }

          setLocalAuction((prev) => {
            if (!prev) return null;

            if (apiPrice !== prev.currentPrice) {
              setPollingInterval(2000);
              return {
                ...prev,
                currentPrice: apiPrice,
              };
            }

            if (!isMaintenanceMode) {
              setPollingInterval((current) => Math.min(10000, current + 1000));
            }
            return prev;
          });
        } catch (error) {
          console.error("Fallback polling failed in Drawer:", error);
          isFetchingRef.current = false;
          if (!isMaintenanceMode) {
            setPollingInterval((current) => Math.min(10000, current + 1000));
          }
        }
      }
    }, 1000);

    return () => clearInterval(silenceDetector);
  }, [
    localAuction?.status,
    auctionId,
    lastActive,
    pollingInterval,
    isMaintenanceMode,
    visible,
  ]);
  // --- End Smart Fallback Logic ---

  if (!localAuction) {
    return null;
  }

  const auction = localAuction; // Re-use auction variable for convenience in rest of code

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

            {/* Connection Status Indicator */}
            {auction.status === AuctionStatus.LIVE && (
              <div className="ml-2 flex items-center">
                {isConnected ? (
                  <Tooltip title="Real-time updates connected">
                    <span className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700/50 rounded-full text-green-400 text-sm">
                      <WifiOutlined className="text-xs" />
                      Connected
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip title="Reconnecting to real-time updates...">
                    <span className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded-full text-yellow-400 text-sm">
                      <span className="animate-spin">⟳</span>
                      Reconnecting...
                    </span>
                  </Tooltip>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Left Column: Image Carousel & Description */}
            <div className="space-y-4">
              {/* Image Carousel */}
              <AuctionImageCarousel images={auction.images} compact />

              {/* Description */}
              <div
                className="prose prose-invert prose-sm prose-zinc max-w-none"
                dangerouslySetInnerHTML={{
                  __html: auction.description || "No description provided.",
                }}
              />
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
          {/* Maintenance Banner */}
          {isMaintenanceMode && (
            <div className="mb-6 animate-pulse">
              <div className="bg-red-900/40 border-2 border-red-500 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="text-red-400 font-bold m-0 p-0 text-sm">
                      System Interruption Detected
                    </h4>
                    <p className="text-red-300 text-xs m-0 p-0">
                      Redis is currently down. Tracking live updates via
                      fallback...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Spin size="small" />
                </div>
              </div>
            </div>
          )}

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

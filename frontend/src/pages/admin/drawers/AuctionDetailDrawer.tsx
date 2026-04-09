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
import { getAvatarUrl } from "../../../utils/imageUtils";

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
            "Người đặt giá cao nhất",
          email: prev.highestBidder?.email || "",
          roles: message.roles || prev.highestBidder?.roles || [UserRole.USER],
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

  // ✅ Visual effects ONLY — state is already updated by onBidUpdate
  const onTimeExtended = useCallback((_newEndTime: string) => {
    setHasTimeExtension(true);
    setTimeout(() => setHasTimeExtension(false), 3000);
  }, []);

  // Connect to WebSocket only when drawer is visible and auction is LIVE
  const shouldConnectSocket =
    visible && localAuction?.status === AuctionStatus.LIVE;

  const { isConnected } = useAuctionWebsocket({
    auctionId: shouldConnectSocket && auctionId ? auctionId : 0,
    onBidUpdate,
    onTimeExtended,
  });

  const [hasTimeExtension, setHasTimeExtension] = useState(false);

  // Read Kafka health from global store (set by useHeartbeat mounted in App.jsx)
  const isKafkaAlive = useUIStore((state) => state.isKafkaAlive);

  // --- Kafka Fallback Polling ---
  // Only activates when useHeartbeat detects the Kafka pipeline is down
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (
      isKafkaAlive ||
      !localAuction ||
      localAuction.status !== AuctionStatus.LIVE ||
      !auctionId ||
      !visible
    )
      return;

    console.warn(
      "[Fallback Drawer] Kafka down — starting state polling at 5s interval",
    );

    const intervalId = setInterval(async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const snapshot = await auctionApi.getAuctionState(auctionId);
        setLocalAuction((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentPrice: snapshot.currentPrice,
            endTime: snapshot.endTime,
            highestBidder: snapshot.highestBidderId
              ? {
                  id: snapshot.highestBidderId,
                  name: snapshot.highestBidderName ?? "",
                  email: snapshot.highestBidderEmail ?? "",
                  roles: prev.highestBidder?.roles ?? [UserRole.USER],
                }
              : prev.highestBidder,
          };
        });
      } catch (err) {
        console.error("[Fallback Drawer] getAuctionState failed:", err);
      } finally {
        isFetchingRef.current = false;
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isKafkaAlive, localAuction?.status, auctionId, visible]);
  // --- End Kafka Fallback Polling ---

  if (!localAuction) {
    return null;
  }

  const auction = localAuction; // Re-use auction variable for convenience in rest of code

  const isLive = auction.status === AuctionStatus.LIVE;
  const isScheduled = auction.status === AuctionStatus.SCHEDULED;

  // Determine if Bid Logs tab should be shown
  const showBidLogsTab = isLive || auction.status === AuctionStatus.ENDED;

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
        <span className="font-semibold" style={{ color: "#FED469" }}>
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
            </div>

            {/* Right Column Content - Now Single Column Stack */}
            <div className="space-y-4">
              {/* Countdown Timer */}
              {shouldShowCountdown && (
                <div
                  style={{
                    background: hasTimeExtension
                      ? "rgba(251,191,36,0.05)"
                      : "transparent",
                    border: hasTimeExtension
                      ? "1px solid rgba(251,191,36,0.25)"
                      : "none",
                    borderRadius: "16px",
                    padding: hasTimeExtension ? "4px" : "0",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isLive ? (
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
                </div>
              )}

              {/* Price Card */}
              <div
                style={{
                  background: "rgba(33,36,46,0.8)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.03)",
                  borderRadius: "20px",
                  padding: "20px",
                }}
              >
                {/* Main price */}
                <div
                  style={{
                    background:
                      auction.status === AuctionStatus.LIVE
                        ? "rgba(254,212,105,0.07)"
                        : "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${auction.status === AuctionStatus.LIVE ? "rgba(254,212,105,0.3)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "16px",
                    padding: "20px 24px",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: "6px",
                    }}
                  >
                    {auction.status === AuctionStatus.LIVE
                      ? "Current Price"
                      : auction.status === AuctionStatus.ENDED
                        ? "Final Price"
                        : "Current Price"}
                  </div>
                  <div
                    key={auction.currentPrice} // Force re-render on price change to trigger animation
                    style={{
                      fontSize: "clamp(2rem, 5vw, 3rem)",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                      background:
                        auction.status === AuctionStatus.LIVE
                          ? "linear-gradient(135deg, #FED469, #FEECBB)"
                          : "rgba(255,255,255,0.9)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter:
                        auction.status === AuctionStatus.LIVE
                          ? "drop-shadow(0 0 15px rgba(254,212,105,0.3))"
                          : "none",
                      animation:
                        auction.status === AuctionStatus.LIVE
                          ? "pricePulse 0.5s ease-out"
                          : "none",
                      display: "inline-block", // Required for transform animation
                    }}
                  >
                    {formatCurrency(auction.currentPrice)}
                  </div>
                </div>

                {/* Supporting prices */}
                <Row gutter={[12, 12]}>
                  <Col xs={12}>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div className="price-label">Starting</div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#fafafa",
                        }}
                      >
                        {formatCurrency(auction.startPrice)}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div className="price-label">Min Step</div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#fafafa",
                        }}
                      >
                        {formatCurrency(auction.minStep)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Seller & Highest Bidder */}
              <div
                style={{
                  background: "rgba(33,36,46,0.85)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.03)",
                  borderRadius: "20px",
                  padding: "20px",
                }}
              >
                <Row gutter={[24, 20]}>
                  <Col xs={24} sm={12}>
                    <div>
                      <div className="price-label">Seller</div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {auction.seller?.avatarUrl && (
                          <Image
                            src={getAvatarUrl(auction.seller.avatarUrl)}
                            alt={auction.seller.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            preview={false}
                          />
                        )}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#fff",
                              fontSize: "14px",
                            }}
                          >
                            {auction.seller?.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            {auction.seller?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {auction.highestBidder && (
                    <Col xs={24} sm={12}>
                      <div>
                        <div className="price-label">
                          {auction.status === AuctionStatus.ENDED
                            ? "Winner 🏆"
                            : "Highest Bidder"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {auction.highestBidder?.avatarUrl && (
                            <Image
                              src={getAvatarUrl(
                                auction.highestBidder.avatarUrl,
                              )}
                              alt={auction.highestBidder.name}
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                              preview={false}
                            />
                          )}
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color:
                                  auction.status === AuctionStatus.LIVE
                                    ? "#FED469"
                                    : "#fff",
                                fontSize: "14px",
                              }}
                            >
                              {auction.highestBidder?.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.4)",
                              }}
                            >
                              {auction.highestBidder?.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>

              {/* Timing Info */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  padding: "16px 20px",
                }}
              >
                <Row gutter={[16, 12]}>
                  <Col xs={24} sm={12}>
                    <div className="info-pair">
                      <span className="info-label">Start Time</span>
                      <span className="info-value">
                        {formatAuctionTime(auction.startTime)}
                      </span>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="info-pair">
                      <span className="info-label">End Time</span>
                      <span className="info-value">
                        {formatAuctionTime(auction.endTime)}
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Description */}
            <div
              className="prose prose-invert prose-zinc max-w-none"
              dangerouslySetInnerHTML={{
                __html: auction.description || "No description provided.",
              }}
            />
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
        <div className="space-y-4 account-table-wrapper">
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
                size="small"
                scroll={{ x: "max-content" }}
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
          backgroundColor: "var(--color-card)", // zinc-950
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

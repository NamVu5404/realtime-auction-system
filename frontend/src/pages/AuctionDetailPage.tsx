import {
  ArrowLeftOutlined,
  RiseOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  Input,
  Row,
  Space,
  Spin,
  Tag,
  Tooltip,
  message,
  notification,
} from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auctionApi } from "../api/auctionApi";
import {
  Auction,
  AuctionStatus,
  BidUpdateMessage,
  UserRole,
} from "../api/types";
import LoginModal from "../components/LoginModal";
import Countdown from "../features/auction/Countdown";
import { useAuth } from "../hooks/useAuth";
import { useAuctionWebsocket } from "../hooks/useAuctionWebsocket";
import { formatAuctionTime, getTimeRemaining } from "../utils/dateUtils";
import { formatCurrency } from "../utils/format";

const DEFAULT_IMAGE =
  "https://png.pngtree.com/background/20231030/original/pngtree-courtroom-judgement-dark-wooden-stand-with-gavel-and-auction-hammer-3d-picture-image_5798933.jpg";

// Tách phần bidding form ra component riêng với state nội bộ
const BiddingSection = memo(
  ({
    isLive,
    isCountdownStarted,
    isCountdownFinished,
    isConnected,
    isReconnecting,
    isAuthenticated,
    minimumBid,
    minStep,
    isBidDisabled,
    bidLoading,
    onPlaceBid,
  }: {
    isLive: boolean;
    isCountdownStarted: boolean;
    isCountdownFinished: boolean;
    isConnected: boolean;
    isReconnecting: boolean;
    isAuthenticated: boolean;
    minimumBid: number;
    minStep: number;
    isBidDisabled: boolean;
    bidLoading: boolean;
    onPlaceBid: (amount: string) => void;
  }) => {
    // State nội bộ - KHÔNG nhận từ props để tránh re-render
    const [localBidAmount, setLocalBidAmount] = useState<string>("");

    if (!((isLive || isCountdownStarted) && !isCountdownFinished)) {
      return (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-gray-400">
            {!isCountdownStarted
              ? "Bidding opens when auction goes live"
              : "This auction has ended"}
          </p>
        </div>
      );
    }

    const handleSubmit = () => {
      onPlaceBid(localBidAmount);
      setLocalBidAmount(""); // Clear sau khi submit
    };

    return (
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h3 className="text-white font-semibold mb-4 text-lg">
          Place Your Bid
        </h3>

        {!isConnected && !isReconnecting && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded text-red-400 text-sm">
            Real-time connection lost. Bidding is temporarily unavailable.
          </div>
        )}

        {isReconnecting && (
          <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400 text-sm">
            Connecting to real-time updates... Please wait.
          </div>
        )}

        <Space.Compact className="w-full">
          <Input
            autoFocus
            type="text"
            inputMode="decimal"
            placeholder={`Min: $${minimumBid.toFixed(2)}`}
            value={localBidAmount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                setLocalBidAmount(val);
              }
            }}
            onPressEnter={handleSubmit}
            disabled={isBidDisabled}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Tooltip
            title={
              !isAuthenticated
                ? "Sign in to place bids"
                : !isConnected
                  ? "Waiting for real-time connection"
                  : isReconnecting
                    ? "Reconnecting..."
                    : isCountdownFinished
                      ? "Auction has ended"
                      : "Place your bid"
            }
          >
            <Button
              type="primary"
              icon={<RiseOutlined />}
              onClick={handleSubmit}
              loading={bidLoading}
              disabled={isBidDisabled}
              style={{
                background: isBidDisabled
                  ? "linear-gradient(135deg, #6B7280 0%, #4B5563 50%)"
                  : "linear-gradient(135deg, #FFD700 0%, #FF8C00 50%)",
                border: "none",
                fontWeight: "bold",
                color: isBidDisabled ? "#9CA3AF" : "#000",
              }}
              className="flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all duration-300"
            >
              Place Bid
            </Button>
          </Tooltip>
        </Space.Compact>

        {!isAuthenticated && (
          <p className="text-xs text-gray-400 mt-2">Sign in to place bids</p>
        )}
        {isCountdownFinished && (
          <p className="text-xs text-red-400 mt-2">
            Auction has ended - bidding is closed
          </p>
        )}
      </div>
    );
  },
);

BiddingSection.displayName = "BiddingSection";

/**
 * Auction Detail Page
 *
 * Features:
 * - Display full auction details with image
 * - Real-time price updates via WebSocket with connection status
 * - Bid placement form with resilience checks (auth, connection, countdown)
 * - Countdown timer to start/end with time extension alerts
 * - Anti-snipe time extension handling
 * - WebSocket reconnection with state sync
 */
export const AuctionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const [isCountdownStarted, setIsCountdownStarted] = useState(false);
  const [hasTimeExtension, setHasTimeExtension] = useState(false);

  const auctionId = id ? parseInt(id, 10) : null;

  // Real-time WebSocket updates with reconnection and time extension handling
  const { isConnected, isReconnecting } = useAuctionWebsocket({
    auctionId: auctionId || 0,
    onBidUpdate: (message: BidUpdateMessage) => {
      // Update local auction state with latest bid info
      if (auction?.id === message.auctionId) {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                currentPrice: message.currentPrice,
                highestBidder: {
                  id: message.highestBidderId,
                  name: message.highestBidderName,
                  email: "",
                  role: UserRole.USER,
                },
              }
            : null,
        );
      }
    },
    onTimeExtended: (newEndTime: string) => {
      // Update endTime state when time is extended
      setHasTimeExtension(true);
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              endTime: newEndTime,
            }
          : null,
      );
      // Reset extension flag after animation
      setTimeout(() => setHasTimeExtension(false), 3000);
    },
    onConnect: () => {
      console.log("Auction WebSocket connected");
    },
    onDisconnect: () => {
      console.log("Auction WebSocket disconnected");
    },
  });

  // Fetch auction details on mount
  useEffect(() => {
    const fetchAuction = async () => {
      if (!auctionId) return;
      setLoading(true);
      try {
        const data = await auctionApi.getAuctionDetail(auctionId);
        setAuction(data);
      } catch (error) {
        message.error("Failed to fetch auction details");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [auctionId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty description="Auction not found" />
        <Button onClick={() => navigate("/")} className="mt-4">
          Back to Auctions
        </Button>
      </div>
    );
  }

  const isLive = auction.status === AuctionStatus.LIVE;
  const isScheduled = auction.status === AuctionStatus.SCHEDULED;
  const isEnded = auction.status === AuctionStatus.ENDED;

  const timeTilStart = getTimeRemaining(auction.startTime);
  const timeTilEnd = getTimeRemaining(auction.endTime);
  const oneHourMs = 3600000;

  // Determine if countdown should be shown
  const shouldShowCountdown =
    isLive || (isScheduled && timeTilStart > 0 && timeTilStart < oneHourMs);

  const minimumBid = auction.currentPrice + auction.minStep;
  const isValidImage = auction.image && !auction.image.includes("placeholder");

  // Determine if bid button should be disabled
  const isBidDisabled =
    bidLoading ||
    !isConnected ||
    isReconnecting ||
    isCountdownFinished ||
    !isAuthenticated ||
    (!isLive && !isCountdownStarted);

  // Handle bid placement with improved error handling and state management
  const handlePlaceBid = async (amount: string) => {
    // Check authentication first
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Check WebSocket connection
    if (!isConnected || isReconnecting) {
      message.error("Waiting for real-time connection. Please try again.");
      return;
    }

    const bidAmountNum = parseFloat(amount);

    if (!amount || isNaN(bidAmountNum)) {
      message.error("Please enter a valid bid amount");
      return;
    }

    if (bidAmountNum < minimumBid) {
      message.error(`Minimum bid is $${minimumBid.toFixed(2)}`);
      return;
    }

    setBidLoading(true);
    try {
      // Get user ID from auth store
      const bidderId = user?.id ? Number(user.id) : 0;
      if (!bidderId) {
        message.error("User information not available");
        return;
      }

      // Place bid using updated endpoint
      const response = await auctionApi.placeBid(
        auction.id,
        bidderId,
        bidAmountNum,
      );

      if (response.success) {
        message.success(response.message || "Bid placed successfully!");
        // Price will be updated via WebSocket immediately
      } else {
        message.error(response.message || "Failed to place bid");
      }
    } catch (error) {
      let errorMessage = "Failed to place bid";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      notification.error({
        message: "Bid Submission Failed",
        description:
          errorMessage ||
          "An error occurred while placing your bid. Please try again.",
        duration: 3,
      });
    } finally {
      setBidLoading(false);
    }
  };

  // Handle countdown completion
  const handleCountdownComplete = async () => {
    console.log(`Countdown completed for auction ${auction.id}`);

    if (isLive) {
      // Countdown for end time → auction finished
      setIsCountdownFinished(true);
      message.info("Auction has ended - bidding is closed");
    } else if (isScheduled) {
      // Countdown for start time → auction started
      setIsCountdownStarted(true);

      // Show notification that auction is live
      message.success("Auction is now LIVE! Start bidding!");

      try {
        // Fetch updated auction data to sync status with backend
        const updatedAuction = await auctionApi.getAuctionDetail(auction.id);
        setAuction(updatedAuction);

        // If backend still shows SCHEDULED, update locally to LIVE for better UX
        if (updatedAuction.status === AuctionStatus.SCHEDULED) {
          setAuction((prev) =>
            prev
              ? {
                  ...prev,
                  status: AuctionStatus.LIVE,
                }
              : null,
          );
        }
      } catch (error) {
        console.error("Failed to fetch updated auction:", error);
        // Fallback: Update status locally even if fetch fails
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                status: AuctionStatus.LIVE,
              }
            : null,
        );
      }

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    }
  };

  return (
    <div className="bg-black min-h-screen py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <div className="flex justify-between items-center mb-6">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/")}
            className="text-gray-300 hover:text-white"
          >
            Back to Auctions
          </Button>

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            {isReconnecting ? (
              <Tooltip title="Reconnecting to real-time updates...">
                <span className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded-full text-yellow-400 text-sm">
                  <span className="animate-spin">⟳</span>
                  Reconnecting...
                </span>
              </Tooltip>
            ) : isConnected ? (
              <Tooltip title="Real-time updates connected">
                <span className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700/50 rounded-full text-green-400 text-sm">
                  <WifiOutlined className="text-xs" />
                  Connected
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Disconnected - attempting to reconnect">
                <span className="flex items-center gap-2 px-3 py-1 bg-red-900/30 border border-red-700/50 rounded-full text-red-400 text-sm">
                  <DisconnectOutlined className="text-xs" />
                  Disconnected
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Row gutter={[32, 32]}>
          {/* Left Column - Image */}
          <Col xs={24} lg={12}>
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {isLive && (
                  <Tag color="red" className="text-base px-3 py-1">
                    LIVE
                  </Tag>
                )}
                {isScheduled && timeTilStart < oneHourMs && (
                  <Tag color="orange" className="text-base px-3 py-1">
                    STARTING SOON
                  </Tag>
                )}
                {isScheduled && timeTilStart >= oneHourMs && (
                  <Tag color="blue" className="text-base px-3 py-1">
                    UPCOMING
                  </Tag>
                )}
                {isEnded && <Tag className="text-base px-3 py-1">ENDED</Tag>}

                {/* Time Extension Badge */}
                {hasTimeExtension && (
                  <Tag
                    color="gold"
                    className="text-base px-3 py-1 animate-pulse"
                  >
                    ⏱ Time Extended!
                  </Tag>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-white mb-2">
                {auction.title}
              </h1>

              {/* Image Card */}
              <Card className="bg-zinc-900 border-zinc-800">
                <Image
                  src={isValidImage ? auction?.image : undefined}
                  alt={auction.title}
                  preview={true}
                  className="w-full rounded-lg"
                  fallback="https://png.pngtree.com/background/20231030/original/pngtree-courtroom-judgement-dark-wooden-stand-with-gavel-and-auction-hammer-3d-picture-image_5798933.jpg"
                />
              </Card>

              {/* Description */}
              <p className="text-gray-400 text-lg">{auction.description}</p>
            </div>
          </Col>

          {/* Right Column - Auction Info & Bidding */}
          <Col xs={24} lg={12}>
            <div className="space-y-6">
              {/* Bidding Form - Sử dụng BiddingSection component */}
              <BiddingSection
                isLive={isLive}
                isCountdownStarted={isCountdownStarted}
                isCountdownFinished={isCountdownFinished}
                isConnected={isConnected}
                isReconnecting={isReconnecting}
                isAuthenticated={isAuthenticated}
                minimumBid={minimumBid}
                minStep={auction.minStep}
                isBidDisabled={isBidDisabled}
                bidLoading={bidLoading}
                onPlaceBid={handlePlaceBid}
              />

              {/* Countdown Timer */}
              {shouldShowCountdown && (
                <Card
                  className={`bg-zinc-900 border-zinc-800 ${
                    hasTimeExtension ? "border-gold-500 animate-pulse" : ""
                  }`}
                >
                  {isLive ? (
                    <Countdown
                      targetTime={auction.endTime}
                      isLive
                      onFinish={handleCountdownComplete}
                    />
                  ) : isScheduled && timeTilStart > 0 ? (
                    <Countdown
                      targetTime={auction.startTime}
                      onFinish={handleCountdownComplete}
                    />
                  ) : null}
                </Card>
              )}

              {/* Current Price - Highlighted */}
              <Card className="bg-zinc-900 border-zinc-800">
                <div className="space-y-6">
                  {/* Current Price - Main Focus */}
                  <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-6 text-center">
                    <div className="text-gray-300 text-sm mb-2">
                      {isLive
                        ? "Current Price"
                        : isEnded
                          ? "Final Price"
                          : "Current Price"}
                    </div>
                    <div
                      className={`text-5xl font-bold ${
                        isLive
                          ? "text-green-400 drop-shadow-lg"
                          : "text-gray-300"
                      }`}
                    >
                      {formatCurrency(auction.currentPrice)}
                    </div>
                  </div>

                  {/* Supporting Prices */}
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={12}>
                      <div className="bg-zinc-800/50 rounded p-3 text-center">
                        <div className="text-gray-400 text-xs mb-1">
                          Starting Price
                        </div>
                        <div className="text-lg font-bold text-yellow-500">
                          {formatCurrency(auction.startPrice)}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} sm={12}>
                      <div className="bg-zinc-800/50 rounded p-3 text-center">
                        <div className="text-gray-400 text-xs mb-1">
                          Min Bid Step
                        </div>
                        <div className="text-lg font-bold text-blue-400">
                          {formatCurrency(auction.minStep)}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>

              {/* Seller & Highest Bidder Info */}
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
                        {!isEnded ? (
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

              {/* Auction Details - Timeline */}
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
            </div>
          </Col>
        </Row>
      </div>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginClick={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default AuctionDetailPage;

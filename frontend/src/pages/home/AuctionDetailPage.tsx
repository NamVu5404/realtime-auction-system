import {
  ArrowLeftOutlined,
  DisconnectOutlined,
  EditOutlined,
  RiseOutlined,
  SettingOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Col,
  Empty,
  Image,
  Input,
  Row,
  Space,
  Spin,
  Tooltip,
} from "antd";
import confetti from "canvas-confetti";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { extractErrorMessage } from "../../api/apiUtils";
import { auctionApi } from "../../api/auctionApi";
import { depositApi } from "../../api/depositApi";
import {
  Auction,
  AuctionStatus,
  BidUpdateMessage,
  DepositStatusResponse,
  UserRole,
} from "../../api/types";
import { AuctionImageCarousel } from "../../components/common/AuctionImageCarousel";
import LoadingPage from "../../components/common/LoadingPage";
import LoginModal from "../../components/LoginModal";
import Countdown from "../../features/auction/Countdown";
import { useAuctionWebsocket } from "../../hooks/useAuctionWebsocket";
import { useAuth } from "../../hooks/useAuth";
import { useUIStore } from "../../store/useUIStore";
import { message, modal, notification } from "../../utils/antdStatic";
import { formatAuctionTime, getTimeRemaining } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/format";
import { getAvatarUrl } from "../../utils/imageUtils";
import FloatingChat from "../../features/auction/chat/FloatingChat";
import WishlistButton from "../../features/auction/WishlistButton";
import { useWishlistBatch } from "../../hooks/useWishlist";

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
    isEnded,
    onPlaceBid,
    depositRequired,
    depositAmount,
    depositStatus,
    depositLoading,
    onPlaceDeposit,
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
    isEnded: boolean;
    onPlaceBid: (amount: string) => void;
    depositRequired: boolean;
    depositAmount: number | null | undefined;
    depositStatus: DepositStatusResponse | null;
    depositLoading: boolean;
    onPlaceDeposit: () => void;
  }) => {
    // State nội bộ - KHÔNG nhận từ props để tránh re-render
    const [localBidAmount, setLocalBidAmount] = useState<string>("");

    const isBiddingPhase = (isLive || isCountdownStarted) && !isCountdownFinished && !isEnded;

    if (!isBiddingPhase) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Deposit banner: chỉ hiện ở SCHEDULED phase, ẩn khi đã kết thúc */}
          {depositRequired && isAuthenticated && !depositStatus?.hasDeposit && !isEnded && !isCountdownFinished && (
            <div
              style={{
                padding: "14px 16px",
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.35)",
                borderRadius: "10px",
              }}
            >
              <p style={{ color: "#fbbf24", fontSize: "13px", margin: "0 0 6px 0", fontWeight: 600 }}>
                Deposit required to bid
              </p>
              {depositAmount != null && (
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", margin: "0 0 12px 0" }}>
                  Deposit amount:{" "}
                  <strong style={{ color: "#fbbf24" }}>{formatCurrency(depositAmount)}</strong>
                </p>
              )}
              <button
                type="button"
                disabled={depositLoading}
                onClick={onPlaceDeposit}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 16px",
                  background: depositLoading ? "rgba(0,0,0,0.3)" : "#191B24",
                  border: "1px solid rgba(251,191,36,0.7)",
                  color: "#fbbf24",
                  fontWeight: 700,
                  fontSize: "13px",
                  borderRadius: "8px",
                  cursor: depositLoading ? "not-allowed" : "pointer",
                  opacity: depositLoading ? 0.6 : 1,
                  fontFamily: "inherit",
                  letterSpacing: "0.02em",
                  transition: "all 0.2s ease",
                }}
              >
                {depositLoading ? "Processing..." : "Deposit Now →"}
              </button>
            </div>
          )}

          {depositRequired && depositStatus?.hasDeposit && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.3)",
                borderRadius: "10px",
                color: "#4ade80",
                fontSize: "12px",
              }}
            >
              ✓ Deposited{" "}
              {depositStatus.depositAmount != null ? formatCurrency(depositStatus.depositAmount) : ""}
            </div>
          )}

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                margin: 0,
                fontSize: "14px",
              }}
            >
              {isEnded || isCountdownFinished
                ? "This auction has ended — no further bids accepted."
                : "Bidding opens when the auction goes live."}
            </p>
          </div>
        </div>
      );
    }

    const handleSubmit = () => {
      onPlaceBid(localBidAmount);
      setLocalBidAmount(""); // Clear after submit
    };

    return (
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
        <h3
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "17px",
            margin: "0 0 16px 0",
            letterSpacing: "-0.01em",
          }}
        >
          Place Your Bid
        </h3>

        {!isConnected && !isReconnecting && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px",
              color: "#f87171",
              fontSize: "13px",
            }}
          >
            Real-time connection lost. Bidding is temporarily unavailable.
          </div>
        )}

        {isReconnecting && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: "10px",
              color: "#fbbf24",
              fontSize: "13px",
            }}
          >
            Connecting to real-time updates... Please wait.
          </div>
        )}

        {/* Deposit banner: yêu cầu đặt cọc trước khi bid */}
        {depositRequired && isAuthenticated && !depositStatus?.hasDeposit && (
          <div
            style={{
              marginBottom: "16px",
              padding: "14px 16px",
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.35)",
              borderRadius: "10px",
            }}
          >
            <p style={{ color: "#fbbf24", fontSize: "13px", margin: "0 0 10px 0", fontWeight: 600 }}>
              Deposit required to bid
            </p>
            {depositAmount != null && (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 10px 0" }}>
                Deposit amount: <strong style={{ color: "#fbbf24" }}>{formatCurrency(depositAmount)}</strong>
              </p>
            )}
            <button
              type="button"
              disabled={depositLoading}
              onClick={onPlaceDeposit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                background: depositLoading ? "rgba(0,0,0,0.3)" : "#191B24",
                border: "1px solid rgba(251,191,36,0.7)",
                color: "#fbbf24",
                fontWeight: 700,
                fontSize: "13px",
                borderRadius: "8px",
                cursor: depositLoading ? "not-allowed" : "pointer",
                opacity: depositLoading ? 0.6 : 1,
                fontFamily: "inherit",
                letterSpacing: "0.02em",
                transition: "all 0.2s ease",
              }}
            >
              {depositLoading ? "Processing..." : "Deposit Now →"}
            </button>
          </div>
        )}

        {/* Đã đặt cọc thành công */}
        {depositRequired && depositStatus?.hasDeposit && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: "10px",
              color: "#4ade80",
              fontSize: "12px",
            }}
          >
            ✓ Deposited {depositStatus.depositAmount != null ? formatCurrency(depositStatus.depositAmount) : ""}
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
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              height: "44px",
              fontSize: "15px",
              borderRadius: "12px 0 0 12px",
            }}
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
              className="bid-cta-btn"
              style={{
                height: "44px",
                borderRadius: "0 12px 12px 0",
                fontWeight: 800,
                fontSize: "14px",
                letterSpacing: "0.04em",
                background: isBidDisabled
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
                border: "none",
                color: isBidDisabled ? "rgba(255,255,255,0.2)" : "#191B24",
                boxShadow: isBidDisabled
                  ? "none"
                  : "0 0 20px rgba(254,212,105,0.2), inset 0 1px 1px rgba(255,255,255,0.4)",
              }}
            >
              Place Bid
            </Button>
          </Tooltip>
        </Space.Compact>

        {!isAuthenticated && (
          <p
            style={{
              color: "rgba(255,255,255,0.38)",
              fontSize: "12px",
              marginTop: "8px",
              margin: "8px 0 0",
            }}
          >
            Sign in to place bids
          </p>
        )}
        {isCountdownFinished && (
          <p
            style={{
              color: "#f87171",
              fontSize: "12px",
              marginTop: "8px",
              margin: "8px 0 0",
            }}
          >
            Auction has ended — bidding is closed
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { isMaintenanceMode, setMaintenanceMode } = useUIStore();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const [isCountdownStarted, setIsCountdownStarted] = useState(false);
  const [hasTimeExtension, setHasTimeExtension] = useState(false);
  const [depositStatus, setDepositStatus] = useState<DepositStatusResponse | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const auctionId = id ? parseInt(id, 10) : null;
  const hasCelebratedRef = useRef(false);

  const { wishlistedSet } = useWishlistBatch(auctionId ? [auctionId] : []);

  // ✅ Premium Celebration Effect (Confetti + Notification) with Persistence
  const triggerCelebration = useCallback(
    (title: string, price: number) => {
      if (hasCelebratedRef.current) return;
      hasCelebratedRef.current = true;

      // Persist to localStorage to prevent re-triggering across sessions
      if (user?.id && auction?.id) {
        const key = `celebrated_auctions_${user.id}`;
        const ids: number[] = JSON.parse(localStorage.getItem(key) ?? "[]");
        if (!ids.includes(auction.id)) {
          ids.push(auction.id);
          localStorage.setItem(key, JSON.stringify(ids));
        }
      }

      console.log("🏆 YOU WON! Triggering premium celebration...");
      // ... animation logic stays the same ...
      const duration = 10 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
      };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      notification.success({
        message: "Congratulations! 🏆",
        description: `You won the auction for "${title}" with a bid of ${formatCurrency(price)}!`,
        duration: 10,
        placement: "top",
        className: "celebration-notification",
      });
    },
    [user?.id, auction?.id],
  );

  useEffect(() => {
    const token = searchParams.get("token");
    if (token && auctionId) {
      const tokens = JSON.parse(localStorage.getItem("auction_tokens") ?? "{}");
      tokens[auctionId] = token;
      localStorage.setItem("auction_tokens", JSON.stringify(tokens));
      searchParams.delete("token");
      setSearchParams(searchParams, { replace: true });
      console.log(`[PrivateMode] Token saved and removed from URL`);
    }
  }, [auctionId, searchParams, setSearchParams]);

  // ✅ Persistent Celebration Switch:
  // Fires whenever an auction moves to ENDED status and the current user is the winner.
  // Covers both live transitions and direct entry (sync/reload).
  useEffect(() => {
    const checkWinnerAndCelebrate = async () => {
      if (!auction || !user?.id) return;

      // Check localStorage first for absolute persistence
      const ids: number[] = JSON.parse(
        localStorage.getItem(`celebrated_auctions_${user.id}`) ?? "[]",
      );
      const isAlreadyCelebrated = ids.includes(auction.id);
      if (isAlreadyCelebrated) {
        hasCelebratedRef.current = true;
        return;
      }

      // Condition: Auction ended, user is authenticated, and hasn't celebrated yet
      if (
        auction?.status === AuctionStatus.ENDED &&
        user?.email &&
        !hasCelebratedRef.current
      ) {
        // Optimization: Quick check local bidder first
        if (auction.highestBidder?.email === user.email) {
          try {
            // Definitive check: Fetch DB results to confirm winner
            const result = await auctionApi.getAuctionResult(auction.id);
            if (result?.details?.winner === user.email) {
              triggerCelebration(auction.title, auction.currentPrice);
            } else {
              hasCelebratedRef.current = true; // Not the winner, stop checking
            }
          } catch (err) {
            console.error(
              "Failed to verify auction winner for celebration:",
              err,
            );
            // Fallback: If result fetch fails but local state says so, trigger anyway
            triggerCelebration(auction.title, auction.currentPrice);
          }
        } else {
          hasCelebratedRef.current = true; // Clearly not the winner
        }
      }
    };

    checkWinnerAndCelebrate();
  }, [auction?.status, user?.email, user?.id, auction?.id, triggerCelebration]);

  // ✅ Single source of truth for ALL WebSocket state updates
  const onBidUpdate = useCallback((message: BidUpdateMessage) => {
    setAuction((prev) => {
      if (!prev || prev.id !== message.auctionId) return prev;

      const newEndTime = message.finalEndTime || prev.endTime;

      console.log("[AuctionDetailPage] onBidUpdate:", {
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
          roles: message.roles || prev.highestBidder?.roles || [UserRole.USER],
        },
        endTime: newEndTime,
      };
    });
  }, []);

  // ✅ Visual effects ONLY — no state update here
  const onTimeExtended = useCallback((_newEndTime: string) => {
    setHasTimeExtension(true);
    setTimeout(() => setHasTimeExtension(false), 3000);
  }, []);

  const onConnect = useCallback(() => {
    console.log("Auction WebSocket connected");
  }, []);

  const onDisconnect = useCallback(() => {
    console.log("Auction WebSocket disconnected");
  }, []);

  // Real-time WebSocket updates with reconnection and time extension handling
  const { isConnected, isReconnecting } = useAuctionWebsocket({
    auctionId: auctionId || 0,
    onBidUpdate,
    onTimeExtended,
    onConnect,
    onDisconnect,
  });

  // Read Kafka health from global store (set by useHeartbeat mounted in App.jsx)
  const isKafkaAlive = useUIStore((state) => state.isKafkaAlive);

  // Fetch deposit status khi auction yêu cầu cọc và user đã đăng nhập
  useEffect(() => {
    if (!auction?.depositRequired || !isAuthenticated || !auctionId) return;
    depositApi.getDepositStatus(auctionId).then(setDepositStatus).catch(() => {});
  }, [auction?.id, auction?.depositRequired, isAuthenticated, auctionId]);

  // --- Kafka Fallback Polling ---
  // Only activates when useHeartbeat detects the Kafka pipeline is down
  // Polls /state endpoint (Redis snapshot) to keep price, bidder, and endTime in sync
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (
      isKafkaAlive ||
      !auction ||
      auction.status !== AuctionStatus.LIVE ||
      !auctionId
    )
      return;

    console.warn(
      "[Fallback] Kafka down — starting state polling at 5s interval",
    );

    const intervalId = setInterval(async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const snapshot = await auctionApi.getAuctionState(auctionId);
        setAuction((prev) => {
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
        console.error("[Fallback] getAuctionState failed:", err);
      } finally {
        isFetchingRef.current = false;
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isKafkaAlive, auction?.status, auctionId]);
  // --- End Kafka Fallback Polling ---

  // Fetch auction details on mount
  useEffect(() => {
    const fetchAuction = async () => {
      if (!auctionId) return;
      setLoading(true);
      try {
        const data = await auctionApi.getAuctionDetail(auctionId);
        setAuction(data);
      } catch (error: any) {
        message.error(extractErrorMessage(error));
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [auctionId, navigate]);

  if (loading) {
    return (
      <LoadingPage
        tip="Loading Auction..."
        message="Preparing real-time bidding room"
      />
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty description="Auction not found" />
        <Button onClick={() => navigate(-1)} className="mt-4">
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

  // Deposit còn thiếu: auction yêu cầu cọc nhưng user chưa cọc
  const needsDeposit = !!auction?.depositRequired && isAuthenticated && !depositStatus?.hasDeposit;

  // Determine if bid button should be disabled
  const isBidDisabled =
    bidLoading ||
    !isConnected ||
    isReconnecting ||
    isCountdownFinished ||
    !isAuthenticated ||
    isMaintenanceMode ||
    needsDeposit ||
    (!isLive && !isCountdownStarted);

  const handlePlaceDeposit = () => {
    if (!auctionId || !auction) return;
    const depositAmt = auction.depositAmount != null ? formatCurrency(auction.depositAmount) : "the required amount";
    modal.confirm({
      title: "Confirm Deposit",
      content: (
        <div className="pt-1">
          <p className="mb-2">
            You are about to lock <strong>{depositAmt}</strong> from your wallet as a bid bond for this auction.
          </p>
          <p className="m-0 text-[13px] text-[var(--color-text-muted)]">
            The amount will be refunded automatically if you don't win. If you win and don't pay, it may be forfeited.
          </p>
        </div>
      ),
      okText: "Confirm Deposit",
      cancelText: "Cancel",
      maskClosable: true,
      onOk: async () => {
        setDepositLoading(true);
        try {
          const result = await depositApi.placeDeposit(auctionId);
          setDepositStatus(result);
          queryClient.invalidateQueries({ queryKey: ["wallet-header"] });
          message.success("Deposit placed successfully!");
        } catch (err) {
          message.error(extractErrorMessage(err));
        } finally {
          setDepositLoading(false);
        }
      },
    });
  };

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

      // Place bid using updated endpoint (V2) — returns full ApiResponse wrapper
      const apiResponse = await auctionApi.placeBidV2(auction.id, bidAmountNum);
      const response = apiResponse.result!;

      if (apiResponse.code < 4000 && response.success) {
        // ✅ Bid accepted — use dynamic success notification from backend
        message.success(
          `🎉 ${apiResponse.message || "Bid placed successfully!"}`,
        );

        // Update locally for instant feedback
        setAuction((prev) =>
          prev && prev.id === auction.id
            ? {
                ...prev,
                currentPrice: response.newPrice,
                highestBidder: {
                  id: response.highestBidderId,
                  name: response.highestBidderName,
                  email: prev.highestBidder?.email || "",
                  roles: response.highestBidderRoles ||
                    prev.highestBidder?.roles || [UserRole.USER],
                },
                endTime: response.finalEndTime || prev.endTime,
              }
            : prev,
        );

        if (response.extended && response.finalEndTime) {
          onTimeExtended(response.finalEndTime);
        }
      } else if (apiResponse.code === 9999) {
        // ⚠️ Concurrency conflict — show the server's message directly
        message.error(apiResponse.message);
      } else {
        // ❌ Other business error — show dynamic server message
        message.error(apiResponse.message);
      }
    } catch (error: any) {
      // Intelligent error routing for thrown (network/HTTP) errors
      notification.error({
        message: "Bid Submission Failed",
        description: extractErrorMessage(error),
        duration: 5,
        className: "bid-notification bid-notification--error",
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

      // Update local state status to trigger the celebration Effect
      setAuction((prev) =>
        prev ? { ...prev, status: AuctionStatus.ENDED } : null,
      );
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

  // Derive owner status for Modular Action Panel
  const deriveIsOwner = (id?: number) => {
    return id == user?.id;
  };

  return (
    <div
      className="detail-page-wrapper"
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        paddingTop: "32px",
        paddingBottom: "64px",
      }}
    >
      <div className="container max-w-7xl mx-auto px-6">
        {/* Maintenance Banner */}
        {isMaintenanceMode && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "2px solid rgba(239,68,68,0.5)",
                borderRadius: "16px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              className="animate-pulse"
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span style={{ fontSize: "24px" }}>⚠️</span>
                <div>
                  <h3
                    style={{
                      color: "#f87171",
                      fontWeight: 700,
                      margin: 0,
                      fontSize: "15px",
                    }}
                  >
                    System Interruption Detected
                  </h3>
                  <p
                    style={{
                      color: "rgba(248,113,113,0.8)",
                      fontSize: "13px",
                      margin: "2px 0 0",
                    }}
                  >
                    Redis is currently down. Bidding is temporarily disabled.
                    Attempting to recover...
                  </p>
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span
                  style={{
                    color: "rgba(248,113,113,0.7)",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  PROBING...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Back Button + Connection Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>

          {/* Connection Status Indicator */}
          <div>
            {isReconnecting ? (
              <Tooltip title="Reconnecting to real-time updates...">
                <span className="status-pill status-pill-reconnecting">
                  <span
                    style={{
                      display: "inline-block",
                      animation: "spin 1s linear infinite",
                    }}
                  >
                    ⟳
                  </span>
                  Reconnecting...
                </span>
              </Tooltip>
            ) : isConnected ? (
              <Tooltip title="Real-time updates connected">
                <span className="status-pill status-pill-connected">
                  <WifiOutlined style={{ fontSize: "11px" }} />
                  Connected
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Disconnected - attempting to reconnect">
                <span className="status-pill status-pill-disconnected">
                  <DisconnectOutlined style={{ fontSize: "11px" }} />
                  Disconnected
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Row gutter={[40, 32]}>
          {/* Left Column - Image & Description */}
          <Col xs={24} lg={13} className="detail-left-col">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Title */}
              <h1
                style={{
                  fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {auction.title}
              </h1>

              {/* Image Carousel + overlaid badges & wishlist */}
              <div style={{ position: "relative" }}>
                <AuctionImageCarousel images={auction.images} />

                {/* Badges — top-left overlay */}
                <div className="carousel-badges-overlay">
                  {isLive && (
                    <span className="badge-live">
                      <span className="live-pulse-dot" />
                      LIVE
                    </span>
                  )}
                  {isScheduled && timeTilStart < oneHourMs && (
                    <span className="badge-soon">STARTING SOON</span>
                  )}
                  {isScheduled && timeTilStart >= oneHourMs && (
                    <span className="badge-upcoming">UPCOMING</span>
                  )}
                  {isEnded && <span className="badge-ended">ENDED</span>}
                  {hasTimeExtension && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 12px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        border: "1px solid rgba(251,191,36,0.4)",
                        color: "#fbbf24",
                        background: "rgba(251,191,36,0.08)",
                      }}
                      className="animate-pulse"
                    >
                      ⏱ Time Extended!
                    </span>
                  )}
                </div>

                {/* Wishlist — top-right overlay */}
                <div className="carousel-wishlist-overlay">
                  <WishlistButton
                    auctionId={auction.id}
                    isWishListed={wishlistedSet.has(auction.id)}
                    size="large"
                    className="wishlist-btn"
                  />
                </div>
              </div>

              {/* Description */}
              <div
                className="prose prose-invert prose-zinc max-w-none"
                style={{ lineHeight: 1.75 }}
                dangerouslySetInnerHTML={{
                  __html: auction.description || "No description provided.",
                }}
              />
            </div>
          </Col>

          {/* Right Column - Auction Info & Bidding */}
          <Col xs={24} lg={11} className="detail-right-col">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                position: "sticky",
                top: "80px",
              }}
            >
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
                    background: isLive
                      ? "var(--color-gold-subtle)"
                      : "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${isLive ? "var(--color-gold-border)" : "var(--color-border-md)"}`,
                    borderRadius: "16px",
                    padding: "20px 24px",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div className="price-label" style={{ marginBottom: "6px" }}>
                    {isLive
                      ? "Current Price"
                      : isEnded
                        ? "Final Price"
                        : "Current Price"}
                  </div>
                  <div
                    key={auction.currentPrice}
                    style={{
                      fontSize: "clamp(2rem, 5vw, 2.8rem)",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                      background: isLive
                        ? "linear-gradient(135deg, var(--color-gold-start), var(--color-gold-end))"
                        : "var(--color-text-primary)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: isLive
                        ? "drop-shadow(0 0 15px var(--color-gold-glow))"
                        : "none",
                      animation: isLive ? "pricePulse 0.5s ease-out" : "none",
                      display: "inline-block",
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
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "rgba(255,255,255,0.4)",
                          marginBottom: "4px",
                        }}
                      >
                        Starting
                      </div>
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
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "rgba(255,255,255,0.4)",
                          marginBottom: "4px",
                        }}
                      >
                        Min Step
                      </div>
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

              {/* ============================================
                  MODULAR ACTION PANEL
                  - Seller: Gold ghost management controls
                  - User: Standard bid form
                  ============================================ */}
              {deriveIsOwner(auction?.seller.id) ? (
                /* SELLER ACTION PANEL */
                <div
                  style={{
                    background: "rgba(42, 45, 58, 0.9)", // #2A2D3A
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "0.5px solid rgba(254,212,105,0.3)",
                    borderRadius: "20px",
                    padding: "20px",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "18px",
                    }}
                  >
                    <SettingOutlined
                      style={{
                        color: "rgba(254,212,105,0.6)",
                        fontSize: "16px",
                      }}
                    />
                    <h3
                      style={{
                        color: "rgba(254,212,105,0.7)",
                        fontWeight: 600,
                        margin: 0,
                        fontSize: "12px",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                      }}
                    >
                      Seller Controls
                    </h3>
                  </div>

                  {/* Auction status */}
                  <div
                    style={{
                      background: "rgba(254,212,105,0.05)",
                      border: "0.5px solid rgba(254,212,105,0.2)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      marginBottom: "16px",
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
                      Auction Status
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {isLive && (
                        <span className="badge-live">
                          <span className="live-pulse-dot" />
                          LIVE
                        </span>
                      )}
                      {isScheduled && (
                        <span className="badge-upcoming">SCHEDULED</span>
                      )}
                      {isEnded && <span className="badge-ended">ENDED</span>}
                      <span
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: "11px",
                        }}
                      >
                        ID: #{auction.id}
                      </span>
                    </div>
                  </div>

                  {/* Ghost gold action button */}
                  <button
                    onClick={() => navigate(`/seller/auctions/${auction.id}`)}
                    style={{
                      width: "100%",
                      height: "42px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "transparent",
                      border: "0.5px solid rgba(254,212,105,0.4)",
                      color: "#FED469",
                      fontWeight: 700,
                      fontSize: "14px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(254,212,105,0.08)";
                      e.currentTarget.style.boxShadow =
                        "0 0 16px rgba(254,212,105,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <EditOutlined />
                    Manage in Dashboard
                  </button>

                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.05)",
                      margin: "16px 0 12px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.35)",
                      margin: 0,
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    Viewing as Seller - Can't bid yourself
                  </p>
                </div>
              ) : (
                /* USER BIDDING SECTION */
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
                  isEnded={isEnded}
                  onPlaceBid={handlePlaceBid}
                  depositRequired={auction.depositRequired ?? false}
                  depositAmount={auction.depositAmount}
                  depositStatus={depositStatus}
                  depositLoading={depositLoading}
                  onPlaceDeposit={handlePlaceDeposit}
                />
              )}

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
                  ) : isScheduled && timeTilStart > 0 ? (
                    <Countdown
                      targetTime={auction.startTime}
                      onFinish={handleCountdownComplete}
                    />
                  ) : null}
                </div>
              )}

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
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "rgba(255,255,255,0.5)",
                          marginBottom: "10px",
                        }}
                      >
                        Seller
                      </div>
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
                            : auction.status !== AuctionStatus.ENDED_NO_SALE
                              ? "Highest Bidder"
                              : "No Sale"}
                        </div>
                        {auction.status !== AuctionStatus.ENDED_NO_SALE && (
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
                        )}
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
          </Col>
        </Row>
      </div>

      {/* Floating Live Chat Icon/Panel */}
      {auctionId && auction.status === AuctionStatus.LIVE && (
        <FloatingChat
          auctionId={auctionId}
          isLive={isLive}
          currentUserId={user?.id ? Number(user.id) : undefined}
          sellerId={auction.seller.id}
          isAdmin={user?.roles?.includes(UserRole.ADMIN)}
        />
      )}

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

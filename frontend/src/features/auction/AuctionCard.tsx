import { useQueryClient } from "@tanstack/react-query";
import { Image } from "antd";
import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auction, AuctionStatus } from "../../api/types";
import { formatAuctionTime, getTimeRemaining } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/format";
import { DEFAULT_AUCTION_IMAGE, getImageUrl } from "../../utils/imageUtils";
import Countdown from "./Countdown";
import WishlistButton from "./WishlistButton";

const DEFAULT_IMAGE = DEFAULT_AUCTION_IMAGE;

interface AuctionCardProps {
  auction: Auction;
  onCountdownComplete?: () => void;
  isWishListed?: boolean;
}

export const AuctionCard = memo(
  ({ auction, onCountdownComplete, isWishListed = false }: AuctionCardProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [countdownStarted, setCountdownStarted] = useState(false);

    // ── Status flags (unchanged logic) ──────────────────────────
    const isLive = auction.status === AuctionStatus.LIVE;
    const isScheduled = auction.status === AuctionStatus.SCHEDULED;
    const isEnded = auction.status === AuctionStatus.ENDED;
    const isEndedNoSale = auction.status === AuctionStatus.ENDED_NO_SALE;

    const timeTilStart = getTimeRemaining(auction.startTime);
    const oneHourMs = 3600000;

    const shouldShowCountdown =
      isLive || (isScheduled && timeTilStart > 0 && timeTilStart < oneHourMs);

    const handleCardClick = () => navigate(`/auction/${auction.id}`);

    const auctionImageUrl = getImageUrl(auction.image);

    const handleCountdownFinish = () => {
      if (isScheduled) {
        setCountdownStarted(true);
        queryClient.invalidateQueries({ queryKey: ["auctions"] });
      }
      onCountdownComplete?.();
    };

    // ── Status badge ─────────────────────────────────────────────
    const StatusBadge = () => {
      if (isLive || countdownStarted)
        return (
          <span className="badge-live">
            <span className="live-pulse-dot" />
            LIVE
          </span>
        );
      if (isScheduled && !countdownStarted && timeTilStart < oneHourMs)
        return <span className="badge-soon">SOON</span>;
      if (isScheduled && !countdownStarted && timeTilStart >= oneHourMs)
        return <span className="badge-upcoming">UPCOMING</span>;
      if (isEnded || isEndedNoSale) return <span className="badge-ended">ENDED</span>;
      return null;
    };

    // ── Price display logic ───────────────────────────────────────
    const priceLabel = isLive || countdownStarted
      ? "Current Price"
      : isEnded
        ? "Final Price"
        : "Starting Price";

    const priceValue = isEnded || isLive || countdownStarted
      ? auction.currentPrice
      : auction.startPrice;

    const priceColor = isLive || countdownStarted
      ? "#FED469"
      : isEnded
        ? "rgba(255,255,255,0.55)"
        : "rgba(255,255,255,0.9)";

    return (
      <div
        onClick={handleCardClick}
        style={{
          background: "var(--color-card)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          overflow: "hidden",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
        }}
        className="group hover-card-effect"
      >
        {/* ── Image (3:2 ratio) ── */}
        <div style={{ position: "relative", aspectRatio: "3/2", overflow: "hidden", flexShrink: 0 }}>
          <Image
            src={auctionImageUrl}
            alt={auction.title}
            preview={false}
            styles={{ root: { width: "100%", height: "100%", display: "block" } }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            }}
            className="group-hover:scale-[1.05]"
            fallback={DEFAULT_IMAGE}
          />

          {/* Bottom fade into card bg */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "70px",
              background: "linear-gradient(to top, var(--color-card), transparent)",
              pointerEvents: "none",
            }}
          />

          {/* Status badge — top left */}
          <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}>
            <StatusBadge />
          </div>

          {/* Wishlist — top right */}
          <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2 }}>
            <WishlistButton
              auctionId={auction.id}
              isWishListed={isWishListed}
              style={{
                background: "rgba(15,17,26,0.55)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
              }}
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div
          style={{
            padding: "14px 16px 16px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "10px",
          }}
        >
          {/* Seller */}
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}
          >
            {auction.seller?.name || "Unknown Seller"}
          </span>

          {/* Title */}
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
            }}
          >
            {auction.title}
          </h3>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

          {/* Price */}
          <div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.35)",
                display: "block",
                marginBottom: "3px",
              }}
            >
              {priceLabel}
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: priceColor,
                letterSpacing: "-0.025em",
                lineHeight: 1,
                ...(isLive || countdownStarted
                  ? { textShadow: "0 0 20px rgba(254,212,105,0.25)" }
                  : {}),
              }}
            >
              {formatCurrency(priceValue)}
            </span>
          </div>

          {/* Countdown */}
          {shouldShowCountdown && (
            <>
              {isLive || countdownStarted ? (
                <Countdown compact targetTime={auction.endTime} isLive onFinish={handleCountdownFinish} />
              ) : isScheduled && timeTilStart > 0 ? (
                <Countdown compact targetTime={auction.startTime} onFinish={handleCountdownFinish} />
              ) : null}
            </>
          )}

          {/* Timing info (when no countdown) */}
          {!shouldShowCountdown && (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {!isEnded && (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                  Starts: {formatAuctionTime(auction.startTime)}
                </span>
              )}
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                {isEnded ? "Ended: " : "Ends: "}
                {formatAuctionTime(auction.endTime)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

AuctionCard.displayName = "AuctionCard";
export default AuctionCard;

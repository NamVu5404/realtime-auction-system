import {
  HeartFilled,
  HeartOutlined,
  LockOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Image } from "antd";
import { memo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Auction, AuctionStatus } from "../../api/types";
import { useWishlist, useWishlistBatch } from "../../hooks/useWishlist";
import { useAuthStore } from "../../store/useAuthStore";
import { formatAuctionTime, getTimeRemaining } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/format";
import {
  DEFAULT_AUCTION_IMAGE,
  getAvatarUrl,
  getImageUrl,
} from "../../utils/imageUtils";
import Countdown from "./Countdown";

const DEFAULT_IMAGE = DEFAULT_AUCTION_IMAGE;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAuctionToken = (auctionId: number): string | null =>
  (
    JSON.parse(localStorage.getItem("auction_tokens") ?? "{}") as Record<
      string,
      string
    >
  )[auctionId] ?? null;

const LockBadge = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "22px",
      height: "22px",
      borderRadius: "6px",
      background: "rgba(15,17,26,0.6)",
      border: "1px solid rgba(255,255,255,0.15)",
      backdropFilter: "blur(6px)",
      color: "rgba(255,255,255,0.7)",
      fontSize: "11px",
    }}
  >
    <LockOutlined />
  </span>
);

// ─── Premium preview card (portaled) ─────────────────────────────────────────

const AuctionPreviewContent = ({
  auction,
  pos,
  onMouseEnter,
  onMouseLeave,
}: {
  auction: Auction;
  pos: { x: number; y: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { wishlistedSet } = useWishlistBatch([auction.id]);
  const isWishlisted = wishlistedSet.has(auction.id);
  const { toggleWishlist, isLoading: wishlistLoading } = useWishlist(
    auction.id,
    isWishlisted,
  );

  const isLive = auction.status === AuctionStatus.LIVE;
  const isEnded =
    auction.status === AuctionStatus.ENDED ||
    auction.status === AuctionStatus.ENDED_NO_SALE;
  const isEndedNoSale = auction.status === AuctionStatus.ENDED_NO_SALE;
  const isScheduled = auction.status === AuctionStatus.SCHEDULED;

  // ── Price display ────────────────────────────────────────
  const priceLabel = isLive
    ? "Current Price"
    : isEnded
      ? "Final Price"
      : "Starting Price";
  const priceValue =
    isEnded || isLive ? auction.currentPrice : auction.startPrice;
  const priceClass = isLive ? "live" : isEnded ? "muted" : "";

  // ── Reserve price ────────────────────────────────────────
  const hasReserve = auction.reservePrice != null && auction.reservePrice > 0;
  const reserveMet =
    hasReserve && auction.currentPrice >= (auction.reservePrice ?? 0);

  // ── Info grid content ────────────────────────────────────
  type GridItem = { label: string; value: string; cls?: string };
  const gridItems: GridItem[] = [];

  if (isLive) {
    gridItems.push({
      label: "Min Bid",
      value: `+${formatCurrency(auction.minStep)}`,
      cls: "accent",
    });
    gridItems.push({
      label: "Ends",
      value: formatAuctionTime(auction.endTime),
    });
    if (hasReserve) {
      gridItems.push({
        label: "Reserve",
        value: reserveMet ? "Met ✓" : "Not met",
        cls: reserveMet ? "green" : "red",
      });
    }
    if (auction.antiSnipeSeconds && auction.antiSnipeSeconds > 0) {
      gridItems.push({
        label: "Anti-snipe",
        value: `${auction.antiSnipeSeconds}s`,
      });
      gridItems.push({
        label: "Extension",
        value: `${auction.extensionSeconds}s`,
      });
    }
  } else if (isScheduled) {
    gridItems.push({
      label: "Starts",
      value: formatAuctionTime(auction.startTime),
    });
    gridItems.push({
      label: "Ends",
      value: formatAuctionTime(auction.endTime),
    });
    gridItems.push({
      label: "Min Bid",
      value: `+${formatCurrency(auction.minStep)}`,
    });
    if (hasReserve) {
      gridItems.push({
        label: "Reserve",
        value: formatCurrency(auction.reservePrice!),
      });
    }
  } else {
    // ENDED / ENDED_NO_SALE
    gridItems.push({
      label: "Ended",
      value: formatAuctionTime(auction.endTime),
    });
    gridItems.push({
      label: "Min Bid",
      value: `+${formatCurrency(auction.minStep)}`,
    });
    if (hasReserve) {
      gridItems.push({
        label: "Reserve",
        value: isEndedNoSale ? "Not met" : "Met ✓",
        cls: isEndedNoSale ? "red" : "green",
      });
    }
  }

  // ── Seller ───────────────────────────────────────────────
  const sellerFallback = `https://ui-avatars.com/api/?background=2a2d3e&color=fed469&bold=true&size=64&name=${encodeURIComponent(auction.seller?.name || "S")}`;
  const sellerAvatar = auction.seller?.avatarUrl
    ? getAvatarUrl(auction.seller.avatarUrl)
    : sellerFallback;

  return (
    <div
      className="auction-preview"
      style={{ left: pos.x, top: pos.y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Image section ── */}
      <div className="auction-preview-img-wrap">
        <img
          src={getImageUrl(auction.image) || DEFAULT_IMAGE}
          alt={auction.title}
          className="auction-preview-img"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_IMAGE;
          }}
        />
        <div className="auction-preview-img-gradient" />

        {/* Status badges — top-left */}
        <div className="auction-preview-badges">
          {isLive && (
            <span className="badge-live">
              <span className="live-pulse-dot" />
              LIVE
            </span>
          )}
          {isScheduled && <span className="badge-upcoming">UPCOMING</span>}
          {isEnded && !isEndedNoSale && (
            <span className="badge-ended">ENDED</span>
          )}
          {isEndedNoSale && <span className="badge-ended">NO SALE</span>}
          {auction.privateMode && <LockBadge />}
        </div>

        {/* Price — bottom of image, on gradient */}
        <div className="auction-preview-price-overlay">
          <p className="auction-preview-price-label">{priceLabel}</p>
          <p className={`auction-preview-price-value ${priceClass}`}>
            {formatCurrency(priceValue)}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="auction-preview-body">
        <p className="auction-preview-title">{auction.title}</p>

        {/* Seller */}
        <div className="auction-preview-seller">
          <img
            src={sellerAvatar}
            alt={auction.seller?.name}
            className="auction-preview-seller-avatar"
            onError={(e) => {
              e.currentTarget.src = sellerFallback;
            }}
          />
          <p className="auction-preview-seller-name">
            {auction.seller?.name || "Unknown Seller"}
          </p>
        </div>

        <div className="auction-preview-divider" />

        {/* Info grid */}
        {gridItems.length > 0 && (
          <div className="auction-preview-grid">
            {gridItems.map((item) => (
              <div key={item.label} className="auction-preview-grid-item">
                <p className="auction-preview-grid-label">{item.label}</p>
                <p
                  className={`auction-preview-grid-value${item.cls ? ` ${item.cls}` : ""}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Leading bidder (LIVE only) */}
        {isLive && (
          <div className="auction-preview-leader">
            {auction.highestBidder ? (
              <>
                <UserOutlined
                  style={{
                    color: "var(--color-gold-start)",
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                />
                <p className="auction-preview-leader-tag">Leading</p>
                <p className="auction-preview-leader-name">
                  {auction.highestBidder.name}
                </p>
              </>
            ) : (
              <>
                <TrophyOutlined
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                />
                <p
                  className="auction-preview-leader-tag"
                  style={{ color: "var(--color-text-muted)", fontWeight: 600 }}
                >
                  No bids yet — be first!
                </p>
              </>
            )}
          </div>
        )}

        {/* Winner (ENDED with winner) */}
        {isEnded && !isEndedNoSale && auction.highestBidder && (
          <div className="auction-preview-leader">
            <TrophyOutlined
              style={{
                color: "var(--color-gold-start)",
                fontSize: "14px",
                flexShrink: 0,
              }}
            />
            <p className="auction-preview-leader-tag">Winner</p>
            <p className="auction-preview-leader-name">
              {auction.highestBidder.name}
            </p>
          </div>
        )}
      </div>

      {/* ── Footer buttons ── */}
      <div className="auction-preview-footer">
        <Button
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/auction/${auction.id}`);
          }}
          style={{ fontWeight: 600, letterSpacing: "0.02em" }}
        >
          View Detail
        </Button>
        <Button
          icon={
            isWishlisted ? (
              <HeartFilled style={{ color: "#F43F5E" }} />
            ) : (
              <HeartOutlined />
            )
          }
          loading={wishlistLoading}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist();
          }}
          style={{
            width: 38,
            borderColor: isWishlisted
              ? "rgba(244,63,94,0.4)"
              : "var(--color-border-md)",
            background: isWishlisted ? "rgba(244,63,94,0.08)" : "transparent",
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
};

// ─── AuctionCard ──────────────────────────────────────────────────────────────

interface AuctionCardProps {
  auction: Auction;
  onCountdownComplete?: () => void;
}

export const AuctionCard = memo(
  ({ auction, onCountdownComplete }: AuctionCardProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [countdownStarted, setCountdownStarted] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (auction.privateMode && !getAuctionToken(auction.id)) {
      return (
        <div className="locked-grid-card">
          <div className="locked-grid-card-inner">
            <div className="locked-grid-card-icon">
              <LockOutlined />
            </div>
            <p className="locked-grid-card-title">
              #{auction.id} · {auction.title}
            </p>
            <p className="locked-grid-card-hint">
              Access via the original share link
            </p>
          </div>
        </div>
      );
    }

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

    // ── Hover logic — 700ms open delay, 300ms close grace ────────────
    const handleCardMouseEnter = () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (openTimer.current) clearTimeout(openTimer.current);
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        setPreviewPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }
      openTimer.current = setTimeout(() => setPreviewOpen(true), 700);
    };

    const handleCardMouseLeave = () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      closeTimer.current = setTimeout(() => setPreviewOpen(false), 300);
    };

    // ── Status badge ──────────────────────────────────────────────────
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
      if (isEnded || isEndedNoSale)
        return <span className="badge-ended">ENDED</span>;
      return null;
    };

    // ── Price display ─────────────────────────────────────────────────
    const priceLabel =
      isLive || countdownStarted
        ? "Current Price"
        : isEnded
          ? "Final Price"
          : "Starting Price";
    const priceValue =
      isEnded || isLive || countdownStarted
        ? auction.currentPrice
        : auction.startPrice;
    const priceColor =
      isLive || countdownStarted
        ? "#FED469"
        : isEnded
          ? "rgba(255,255,255,0.55)"
          : "rgba(255,255,255,0.9)";

    return (
      <>
        <div
          ref={cardRef}
          onClick={handleCardClick}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
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
          {/* ── Image 3:2 ── */}
          <div
            style={{
              position: "relative",
              aspectRatio: "3/2",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Image
              src={auctionImageUrl}
              alt={auction.title}
              preview={false}
              styles={{
                root: { width: "100%", height: "100%", display: "block" },
              }}
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
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "70px",
                background:
                  "linear-gradient(to top, var(--color-card), transparent)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <StatusBadge />
              {auction.privateMode && <LockBadge />}
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
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1,
              }}
            >
              {auction.seller?.name || "Unknown Seller"}
            </span>
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
            <div
              style={{ height: "1px", background: "rgba(255,255,255,0.05)" }}
            />
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
            {shouldShowCountdown && (
              <>
                {isLive || countdownStarted ? (
                  <Countdown
                    compact
                    targetTime={auction.endTime}
                    isLive
                    onFinish={handleCountdownFinish}
                  />
                ) : isScheduled && timeTilStart > 0 ? (
                  <Countdown
                    compact
                    targetTime={auction.startTime}
                    onFinish={handleCountdownFinish}
                  />
                ) : null}
              </>
            )}
            {!shouldShowCountdown && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "3px" }}
              >
                {!isEnded && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    Starts: {formatAuctionTime(auction.startTime)}
                  </span>
                )}
                <span
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}
                >
                  {isEnded ? "Ended: " : "Ends: "}
                  {formatAuctionTime(auction.endTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Preview portal ── */}
        {previewOpen &&
          createPortal(
            <AuctionPreviewContent
              auction={auction}
              pos={previewPos}
              onMouseEnter={() => {
                if (closeTimer.current) clearTimeout(closeTimer.current);
              }}
              onMouseLeave={() => setPreviewOpen(false)}
            />,
            document.body,
          )}
      </>
    );
  },
);

AuctionCard.displayName = "AuctionCard";
export default AuctionCard;

import { useQueryClient } from "@tanstack/react-query";
import { Image } from "antd";
import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auction, AuctionStatus } from "../../api/types";
import { formatAuctionTime, getTimeRemaining } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/format";
import { DEFAULT_AUCTION_IMAGE, getImageUrl } from "../../utils/imageUtils";
import Countdown from "./Countdown";

const DEFAULT_IMAGE = DEFAULT_AUCTION_IMAGE;

interface AuctionCardProps {
  auction: Auction;
  onCountdownComplete?: () => void;
}

export const AuctionCard = memo(
  ({ auction, onCountdownComplete }: AuctionCardProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [countdownStarted, setCountdownStarted] = useState(false);

    const isLive = auction.status === AuctionStatus.LIVE;
    const isScheduled = auction.status === AuctionStatus.SCHEDULED;
    const isEnded = auction.status === AuctionStatus.ENDED;

    const timeTilStart = getTimeRemaining(auction.startTime);
    const oneHourMs = 3600000;

    const shouldShowCountdown =
      isLive || (isScheduled && timeTilStart > 0 && timeTilStart < oneHourMs);

    const handleCardClick = () => {
      navigate(`/auction/${auction.id}`);
    };

    const auctionImageUrl = getImageUrl(auction.image);

    const handleCountdownFinish = () => {
      if (isScheduled) {
        setCountdownStarted(true);
        queryClient.invalidateQueries({ queryKey: ["auctions"] });
      }
      onCountdownComplete?.();
    };

    const StatusBadge = () => {
      if (isLive || countdownStarted) {
        return (
          <span className="badge-live">
            <span className="live-pulse-dot" />
            LIVE
          </span>
        );
      }
      if (isScheduled && !countdownStarted && timeTilStart < oneHourMs) {
        return <span className="badge-soon">SOON</span>;
      }
      if (isScheduled && !countdownStarted && timeTilStart >= oneHourMs) {
        return <span className="badge-upcoming">UPCOMING</span>;
      }
      if (isEnded) {
        return <span className="badge-ended">ENDED</span>;
      }
      return null;
    };

    return (
      <div
        onClick={handleCardClick}
        style={{
          background: "#21242E",
          border: "1px solid rgba(255,255,255,0.03)",
          borderRadius: "20px",
          overflow: "hidden",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
        className="group hover:-translate-y-1 hover:border-[rgba(254,212,105,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(254,212,105,0.08)]"
      >
        {/* Image */}
        <div
          style={{
            position: "relative",
            height: "200px",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <Image
            src={auctionImageUrl}
            alt={auction.title}
            preview={false}
            styles={{
              root: {
                width: "100%",
                height: "200px",
                display: "block",
                overflow: "hidden",
              },
            }}
            style={{
              width: "100%",
              height: "200px",
              objectFit: "cover",
              display: "block",
              objectPosition: "center center",
              transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            }}
            className="group-hover:scale-[1.04]"
            fallback={DEFAULT_IMAGE}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "90px",
              background: "linear-gradient(to top, #21242E, transparent)",
              pointerEvents: "none",
            }}
          />
          {/* Status badge */}
          <div style={{ position: "absolute", top: "12px", left: "12px" }}>
            <StatusBadge />
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "12px",
          }}
        >
          {/* Title */}
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {auction.title}
          </h3>

          {/* Price */}
          <div
            style={{
              background:
                isLive || countdownStarted
                  ? "rgba(254,212,105,0.06)"
                  : "rgba(255,255,255,0.03)",
              border: `0.5px solid ${
                isLive || countdownStarted
                  ? "rgba(254,212,105,0.3)"
                  : "rgba(255,255,255,0.08)"
              }`,
              borderRadius: "12px",
              padding: "10px 14px",
            }}
          >
            {isLive || countdownStarted ? (
              <div>
                <div className="price-label">Current Price</div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#FED469",
                    letterSpacing: "-0.02em",
                    textShadow: "0 0 20px rgba(254,212,105,0.3)",
                  }}
                >
                  {formatCurrency(auction.currentPrice)}
                </div>
              </div>
            ) : isEnded ? (
              <div>
                <div className="price-label">Final Price</div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.75)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatCurrency(auction.currentPrice)}
                </div>
              </div>
            ) : (
              <div>
                <div className="price-label">Starting Price</div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "rgba(255, 255, 255, 0.85)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatCurrency(auction.startPrice)}
                </div>
              </div>
            )}
          </div>

          {/* Countdown */}
          {shouldShowCountdown && (
            <div>
              {isLive || countdownStarted ? (
                <Countdown
                  targetTime={auction.endTime}
                  isLive
                  onFinish={handleCountdownFinish}
                />
              ) : isScheduled && timeTilStart > 0 ? (
                <Countdown
                  targetTime={auction.startTime}
                  onFinish={handleCountdownFinish}
                />
              ) : null}
            </div>
          )}

          {/* Timing */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "8px 12px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "4px",
              }}
            >
              Timing
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
              }}
            >
              <div>Start: {formatAuctionTime(auction.startTime)}</div>
              <div>End: {formatAuctionTime(auction.endTime)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

AuctionCard.displayName = "AuctionCard";
export default AuctionCard;

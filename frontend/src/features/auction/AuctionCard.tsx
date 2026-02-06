import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Image, Tag, Empty } from "antd";
import { useState, memo } from "react";
import { Auction, AuctionStatus } from "../../api/types";
import {
  convertUTCToLocal,
  formatAuctionTime,
  getTimeRemaining,
  hasAuctionStarted,
} from "../../utils/dateUtils";
import Countdown from "./Countdown";
import { formatCurrency } from "../../utils/format";

const DEFAULT_IMAGE =
  "https://png.pngtree.com/background/20231030/original/pngtree-courtroom-judgement-dark-wooden-stand-with-gavel-and-auction-hammer-3d-picture-image_5798933.jpg";

interface AuctionCardProps {
  auction: Auction;
  onCountdownComplete?: () => void;
}

/**
 * Auction Card Component
 *
 * Displays:
 * - Auction image with placeholder fallback
 * - Status badge (LIVE, STARTING SOON, UPCOMING, ENDED)
 * - Title and description
 * - Price display (conditional based on status)
 * - Countdown timer (for LIVE and STARTING SOON)
 * - Timing information in local timezone
 * - Seller information
 *
 * Events:
 * - onCountdownComplete: Triggered when countdown reaches 00:00:00
 *   This should refetch auctions to sync status changes
 */
export const AuctionCard = memo(
  ({ auction, onCountdownComplete }: AuctionCardProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [countdownStarted, setCountdownStarted] = useState(false);

    const isLive = auction.status === AuctionStatus.LIVE;
    const isScheduled = auction.status === AuctionStatus.SCHEDULED;
    const isEnded = auction.status === AuctionStatus.ENDED;

    // Convert UTC times to local timezone
    const startTimeLocal = convertUTCToLocal(auction.startTime);
    const endTimeLocal = convertUTCToLocal(auction.endTime);

    // Calculate time until start
    const timeTilStart = getTimeRemaining(auction.startTime);
    const oneHourMs = 3600000;

    // Show countdown if:
    // 1. Auction is LIVE and hasn't ended, OR
    // 2. Auction is SCHEDULED and starts within 1 hour
    const shouldShowCountdown =
      isLive || (isScheduled && timeTilStart > 0 && timeTilStart < oneHourMs);

    const handleCardClick = () => {
      navigate(`/auction/${auction.id}`);
    };

    const isValidImage =
      auction.image && !auction.image.includes("placeholder");

    // Handle countdown completion
    const handleCountdownFinish = () => {
      console.log(`Countdown finished for auction ${auction.id}`);
      // If countdown was for start time, mark auction as started
      if (isScheduled) {
        setCountdownStarted(true);
        // Invalidate queries to fetch updated LIVE status from backend
        queryClient.invalidateQueries({ queryKey: ["auctions"] });
      }
      // Trigger refetch to sync UI with backend scheduler status changes
      onCountdownComplete?.();
    };

    return (
      <Card
        hoverable
        onClick={handleCardClick}
        className="h-full flex flex-col cursor-pointer transition-all duration-300 bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:scale-105"
        cover={
          <Image
            src={isValidImage ? auction.image : DEFAULT_IMAGE}
            alt={auction.title}
            preview={false}
            className="h-48 object-cover"
            fallback={DEFAULT_IMAGE}
          />
        }
      >
        <div className="flex flex-col flex-grow">
          {/* Status Badge */}
          <div className="mb-3">
            {(isLive || countdownStarted) && <Tag color="green">LIVE</Tag>}
            {isScheduled && !countdownStarted && timeTilStart < oneHourMs && (
              <Tag color="orange">STARTING SOON</Tag>
            )}
            {isScheduled && !countdownStarted && timeTilStart >= oneHourMs && (
              <Tag color="blue">UPCOMING</Tag>
            )}
            {isEnded && <Tag color="default">ENDED</Tag>}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-white">
            {auction.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {auction.description}
          </p>

          {/* Price Display - Conditional based on status */}
          <div className="bg-zinc-800 p-3 rounded-lg mb-4">
            {isLive || countdownStarted ? (
              <div>
                <div className="text-xs text-gray-400 mb-1">Current Price</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(auction.currentPrice)}
                </div>
              </div>
            ) : isEnded ? (
              <div>
                <div className="text-xs text-gray-400 mb-1">Final Price</div>
                <div className="text-2xl font-bold text-gray-300">
                  {formatCurrency(auction.currentPrice)}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-gray-400 mb-1">Starting Price</div>
                <div className="text-2xl font-bold text-yellow-500">
                  {formatCurrency(auction.startPrice)}
                </div>
              </div>
            )}
          </div>

          {/* Countdown Timer - Shows for LIVE or STARTING SOON */}
          {shouldShowCountdown && (
            <div className="mb-4">
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

          {/* Timing Information - Shows times in user's local timezone */}
          <div className="bg-zinc-800 p-3 rounded-lg mb-4">
            <div className="text-xs text-gray-400 mb-1">Timing</div>
            <div className="text-xs text-gray-300 space-y-1">
              <div>Start: {formatAuctionTime(auction.startTime)}</div>
              <div>End: {formatAuctionTime(auction.endTime)}</div>
            </div>
          </div>

          {/* Seller Information */}
          <p className="text-xs text-gray-500 mt-auto">
            Seller:{" "}
            <span className="font-medium text-gray-300">
              {auction.seller?.name || "Unknown"}
            </span>
          </p>
        </div>
      </Card>
    );
  },
);

AuctionCard.displayName = "AuctionCard";

export default AuctionCard;

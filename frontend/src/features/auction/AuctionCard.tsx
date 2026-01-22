import { useNavigate } from "react-router-dom";
import { Card, Image, Empty, Tag } from "antd";
import dayjs from "dayjs";
import { AuctionItem } from "../../types";
import Countdown from "./Countdown";

const DEFAULT_IMAGE =
  "https://png.pngtree.com/background/20231030/original/pngtree-courtroom-judgement-dark-wooden-stand-with-gavel-and-auction-hammer-3d-picture-image_5798933.jpg";

interface AuctionCardProps {
  auction: AuctionItem;
}

export const AuctionCard = ({ auction }: AuctionCardProps) => {
  const navigate = useNavigate();

  const isLive = auction.status === "LIVE";
  const isScheduled = auction.status === "SCHEDULED";
  const isEnded = auction.status === "ENDED";

  const now = dayjs();
  const startTime = dayjs(auction.startTime);
  const endTime = dayjs(auction.endTime);
  const timeTilStart = startTime.diff(now);

  // Show countdown ONLY IF: status is LIVE OR status is SCHEDULED but < 1 hour to start
  const shouldShowCountdown =
    isLive || (isScheduled && timeTilStart > 0 && timeTilStart < 3600000);

  const handleCardClick = () => {
    navigate(`/auction/${auction.id}`);
  };

  const isValidImage =
    auction.imageUrl && !auction.imageUrl.includes("via.placeholder.com");

  return (
    <Card
      hoverable
      onClick={handleCardClick}
      className="h-full flex flex-col cursor-pointer transition-all duration-300 bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:scale-105"
      cover={
        <Image
          src={isValidImage ? auction.imageUrl : DEFAULT_IMAGE}
          alt={auction.title}
          preview={false}
          className="h-48 object-cover"
        />
      }
    >
      <div className="flex flex-col flex-grow">
        {/* Status Badge */}
        <div className="mb-3">
          {isLive && <Tag color="red">LIVE</Tag>}
          {isScheduled && timeTilStart < 3600000 && (
            <Tag color="orange">STARTING SOON</Tag>
          )}
          {isScheduled && timeTilStart >= 3600000 && (
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

        {/* Price Display - Conditional */}
        <div className="bg-zinc-800 p-3 rounded-lg mb-4">
          {isLive ? (
            <div>
              <div className="text-xs text-gray-400 mb-1">Current Price</div>
              <div className="text-2xl font-bold text-green-400">
                ${auction.currentPrice}
              </div>
            </div>
          ) : isEnded ? (
            <div>
              <div className="text-xs text-gray-400 mb-1">Final Price</div>
              <div className="text-2xl font-bold text-gray-300">
                ${auction.currentPrice}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-gray-400 mb-1">Starting Price</div>
              <div className="text-2xl font-bold text-yellow-500">
                ${auction.startPrice}
              </div>
            </div>
          )}
        </div>

        {/* Countdown - Show only if within 1 hour of start or LIVE */}
        {shouldShowCountdown && (
          <div className="mb-4">
            {isLive ? (
              <Countdown endTime={auction.endTime} isLive />
            ) : isScheduled && timeTilStart > 0 ? (
              <Countdown endTime={auction.startTime} />
            ) : null}
          </div>
        )}

        {/* Timing Info - Always show */}
        <div className="bg-zinc-800 p-3 rounded-lg mb-4">
          <div className="text-xs text-gray-400 mb-1">Timing</div>
          <div className="text-xs text-gray-300">
            <div>Start: {dayjs(auction.startTime).format("MMM DD, HH:mm")}</div>
            <div>End: {dayjs(auction.endTime).format("MMM DD, HH:mm")}</div>
          </div>
        </div>

        {/* Seller Info */}
        <p className="text-xs text-gray-500 mt-auto">
          Seller:{" "}
          <span className="font-medium text-gray-300">
            {auction.sellerName}
          </span>
        </p>
      </div>
    </Card>
  );
};

export default AuctionCard;

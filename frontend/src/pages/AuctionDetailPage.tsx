import { ArrowLeftOutlined, RiseOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Image,
  Input,
  Row,
  Space,
  Spin,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auctionApi } from "../api/auctionApi";
import Countdown from "../features/auction/Countdown";
import { useWebSocket } from "../hooks/useWebSocket";
import { AuctionItem } from "../types";

const DEFAULT_IMAGE =
  "https://png.pngtree.com/background/20231030/original/pngtree-courtroom-judgement-dark-wooden-stand-with-gavel-and-auction-hammer-3d-picture-image_5798933.jpg";

export const AuctionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<AuctionItem | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);

  const { isConnected } = useWebSocket({
    onPriceUpdate: (event) => {
      if (auction?.id === event.auctionId) {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                currentPrice: event.currentPrice,
                highestBidderId: event.highestBidderId,
                highestBidderName: event.highestBidderName,
              }
            : null,
        );
      }
    },
  });

  useEffect(() => {
    const fetchAuction = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await auctionApi.getAuctionById(id);
        setAuction(data);
      } catch (error) {
        message.error("Failed to fetch auction details");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [id, navigate]);

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

  const isLive = auction.status === "LIVE";
  const isScheduled = auction.status === "SCHEDULED";
  const isEnded = auction.status === "ENDED";

  const now = dayjs();
  const startTime = dayjs(auction.startTime);
  const endTime = dayjs(auction.endTime);
  const timeTilStart = startTime.diff(now);

  const minimumBid = auction.currentPrice + auction.minStep;

  const isValidImage =
    auction.imageUrl && !auction.imageUrl.includes("via.placeholder.com");

  const handlePlaceBid = async () => {
    const bidAmountNum = parseFloat(bidAmount);

    if (!bidAmount || isNaN(bidAmountNum)) {
      message.error("Please enter a valid bid amount");
      return;
    }

    if (bidAmountNum < minimumBid) {
      message.error(`Minimum bid is ${minimumBid}`);
      return;
    }

    setBidLoading(true);
    try {
      const response = await auctionApi.placeBid({
        auctionId: auction.id,
        bidAmount: bidAmountNum,
      });

      if (response.success) {
        setBidAmount("");
        message.success("Bid placed successfully!");
        // Auction state will be updated via WebSocket
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to place bid",
      );
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
          className="mb-6 text-gray-300 hover:text-white"
        >
          Back to Auctions
        </Button>

        {/* Main Content */}
        <Row gutter={[32, 32]}>
          {/* Left Column - Image Gallery */}
          <Col xs={24} lg={12}>
            <div className="space-y-6">
              {/* Status Badge */}
              <div>
                {isLive && (
                  <Tag color="red" className="text-base px-3 py-1">
                    LIVE
                  </Tag>
                )}
                {isScheduled && timeTilStart < 3600000 && (
                  <Tag color="orange" className="text-base px-3 py-1">
                    STARTING SOON
                  </Tag>
                )}
                {isScheduled && timeTilStart >= 3600000 && (
                  <Tag color="blue" className="text-base px-3 py-1">
                    UPCOMING
                  </Tag>
                )}
                {isEnded && <Tag className="text-base px-3 py-1">ENDED</Tag>}
              </div>

              {/* Title */}

              <h1 className="text-4xl font-bold text-white mb-2">
                {auction.title}
              </h1>

              <Card className="bg-zinc-900 border-zinc-800">
                <Image
                  src={isValidImage ? auction.imageUrl : DEFAULT_IMAGE}
                  alt={auction.title}
                  preview={true}
                  className="w-full rounded-lg"
                />
              </Card>

              <p className="text-gray-400 text-lg">{auction.description}</p>
            </div>
          </Col>

          {/* Right Column - Auction Info & Controls */}
          <Col xs={24} lg={12}>
            <div className="space-y-6">
              {/* Bidding Form */}
              {isLive ? (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <h3 className="text-white font-semibold mb-3">
                    Place Your Bid
                  </h3>
                  <Space.Compact className="w-full">
                    <Input
                      type="number"
                      placeholder={`Min: $${minimumBid}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minimumBid}
                      step={auction.minStep}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <Button
                      type="primary"
                      icon={<RiseOutlined />}
                      onClick={handlePlaceBid}
                      loading={bidLoading}
                      // 1. Dùng style để đổ gradient (Yellow -> Orange)
                      style={{
                        background:
                          "linear-gradient(135deg, #FFD700 0%, #FF8C00 50%)",
                        border: "none",
                        fontWeight: "bold",
                        color: "#000", // Chữ đen sẽ nổi hơn trên nền vàng cam, hoặc đổi #fff nếu muốn
                      }}
                      // 2. Dùng className để xử lý hiệu ứng hover/scale
                      className="flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all duration-300"
                    >
                      Place Bid
                    </Button>
                  </Space.Compact>
                  <div className="text-xs text-gray-400 mt-2">
                    {isConnected && (
                      <span className="text-green-400">
                        ✓ Real-time updates active
                      </span>
                    )}
                  </div>
                </div>
              ) : isScheduled ? (
                <div className="bg-yellow-900 bg-opacity-30 p-4 rounded-lg border border-yellow-700">
                  <p className="text-yellow-300 font-semibold">
                    ⏰ This auction has not started yet. Bidding will be
                    available when it starts.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-900 bg-opacity-30 p-4 rounded-lg border border-gray-700">
                  <p className="text-gray-300 font-semibold">
                    ✓ This auction has ended.
                  </p>
                </div>
              )}

              <Divider className="bg-zinc-700" />

              {/* Countdown - Show if Live or Starting Soon */}
              {(isLive || (isScheduled && timeTilStart < 3600000)) && (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  {isLive ? (
                    <Countdown endTime={auction.endTime} isLive />
                  ) : (
                    <Countdown endTime={auction.startTime} />
                  )}
                </div>
              )}

              {/* Price Info */}
              <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <h3 className="text-white font-semibold mb-3">
                  Price Information
                </h3>
                <Row gutter={16}>
                  <Col xs={12}>
                    <div className="text-gray-400 text-sm mb-1">
                      Starting Price
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">
                      ${auction.startPrice}
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="text-gray-400 text-sm mb-1">
                      Current Price
                    </div>
                    <div
                      className={`text-2xl font-bold ${isLive ? "text-green-400" : "text-gray-300"}`}
                    >
                      ${auction.currentPrice}
                    </div>
                  </Col>
                </Row>
                <div className="text-gray-400 text-sm mt-2">
                  Min Step: ${auction.minStep}
                </div>
              </div>

              {/* Seller & Highest Bidder Info */}
              <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-3">
                <div>
                  <div className="text-gray-400 text-sm">Seller</div>
                  <div className="text-white font-semibold">
                    {auction.sellerName}
                  </div>
                </div>
                {auction.highestBidderId && (
                  <div>
                    <div className="text-gray-400 text-sm">Highest Bidder</div>
                    <div className="text-white font-semibold">
                      {auction.highestBidderName}
                    </div>
                  </div>
                )}
              </div>

              {/* Timing Info */}
              <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <h3 className="text-white font-semibold mb-3">Timing</h3>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Start:</span>
                    <span>
                      {dayjs(auction.startTime).format("MMM DD, YYYY HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>End:</span>
                    <span>
                      {dayjs(auction.endTime).format("MMM DD, YYYY HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AuctionDetailPage;

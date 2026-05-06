import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  HeartFilled,
  HeartOutlined,
  RiseOutlined,
  ShopOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Carousel, Empty, Skeleton } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { auctionApi } from "../../api/auctionApi";
import bidApi from "../../api/bidApi";
import { heroSlideApi } from "../../api/heroSlideApi";
import {
  Auction,
  AuctionStatus,
  MyBidHistoryResponse,
  RecentBidFeedResponse,
  TopBidderPublicResponse,
  TopSellerPublicResponse,
} from "../../api/types";
import userApi from "../../api/userApi";
import { wishlistApi } from "../../api/wishlistApi";
import AuctionCard from "../../features/auction/AuctionCard";
import Countdown from "../../features/auction/Countdown";
import { useAuctions } from "../../hooks/useAuctions";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useWishlist, useWishlistBatch } from "../../hooks/useWishlist";
import { useAuthStore } from "../../store/useAuthStore";
import { formatCurrency } from "../../utils/format";
import {
  DEFAULT_AUCTION_IMAGE,
  getAvatarUrl,
  getImageUrl,
} from "../../utils/imageUtils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDown = true;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollLeft = startScrollLeft - (e.clientX - startX);
    };
    const onStop = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "grab";
      if (Math.abs(el.scrollLeft - startScrollLeft) > 4) {
        el.addEventListener("click", (e) => e.stopPropagation(), {
          capture: true,
          once: true,
        });
      }
    };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onStop);
    el.addEventListener("mouseleave", onStop);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onStop);
      el.removeEventListener("mouseleave", onStop);
    };
  }, []);
  return ref;
}

function useDragScrollY() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let isDown = false;
    let startY = 0;
    let startScrollTop = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startY = e.clientY;
      startScrollTop = el.scrollTop;
      el.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollTop = startScrollTop - (e.clientY - startY);
    };
    const onStop = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "grab";
      if (Math.abs(el.scrollTop - startScrollTop) > 4) {
        el.addEventListener("click", (e) => e.stopPropagation(), {
          capture: true,
          once: true,
        });
      }
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onStop);
    el.addEventListener("mouseleave", onStop);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onStop);
      el.removeEventListener("mouseleave", onStop);
    };
  }, []);
  return ref;
}

// ─── LazySection — chỉ render khi vào viewport ───────────────────────────────

function useLazyVisible(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);
  return { ref, visible };
}

const LazySection = ({
  children,
  minHeight = 200,
}: {
  children: React.ReactNode;
  minHeight?: number;
}) => {
  const { ref, visible } = useLazyVisible();
  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible && children}
    </div>
  );
};

const isEndingSoon = (endTime: string) => {
  const diff = new Date(endTime).getTime() - Date.now();
  return diff > 0 && diff < 2 * 60 * 60 * 1000;
};

// ─── Top Sellers ─────────────────────────────────────────────────────────────

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=2a2d3e&color=fed469&bold=true&size=128";

const SellerAvatar = ({ seller }: { seller: TopSellerPublicResponse }) => {
  const [hovered, setHovered] = useState(false);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fallbackSrc = `${DEFAULT_AVATAR}&name=${encodeURIComponent(seller.name)}`;
  const avatarSrc = seller.avatarUrl
    ? getAvatarUrl(seller.avatarUrl)
    : fallbackSrc;

  const handleMouseEnter = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCardPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
    setHovered(true);
  };

  return (
    <div
      ref={wrapperRef}
      className="seller-avatar-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`seller-avatar-ring${hovered ? " is-hovered" : ""}`}>
        <img
          src={avatarSrc}
          alt={seller.name}
          onError={(e) => {
            e.currentTarget.src = fallbackSrc;
          }}
          className="seller-avatar-img"
        />
      </div>

      <p className={`seller-avatar-name${hovered ? " is-hovered" : ""}`}>
        {seller.name}
      </p>

      {hovered &&
        createPortal(
          <div
            className="seller-preview-card"
            style={{ left: cardPos.x, top: cardPos.y }}
          >
            <div className="seller-preview-arrow" />
            <div className="seller-preview-header">
              <img
                src={avatarSrc}
                alt={seller.name}
                onError={(e) => {
                  e.currentTarget.src = fallbackSrc;
                }}
                className="seller-preview-avatar"
              />
              <div className="seller-preview-info">
                <div className="seller-preview-name-row">
                  <p className="seller-preview-name">{seller.name}</p>
                  {seller.isVerifiedIdentity && (
                    <CheckCircleFilled
                      style={{
                        fontSize: "12px",
                        color: "var(--color-gold-start)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                {seller.location && (
                  <p className="seller-preview-location">{seller.location}</p>
                )}
              </div>
            </div>
            <div className="seller-preview-stats">
              {[
                {
                  icon: <ShopOutlined />,
                  value: seller.soldAuctions,
                  label: "Sold",
                },
                {
                  icon: <ThunderboltOutlined />,
                  value: seller.liveAuctions,
                  label: "Live",
                },
                {
                  icon: <RiseOutlined />,
                  value: seller.totalAuctions,
                  label: "Total",
                },
              ].map(({ icon, value, label }) => (
                <div key={label} className="seller-preview-stat">
                  <div className="seller-preview-stat-icon">{icon}</div>
                  <p className="seller-preview-stat-value">{value}</p>
                  <p className="seller-preview-stat-label">{label}</p>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

const TopSellersSection = ({
  sellers,
  loading,
}: {
  sellers: TopSellerPublicResponse[];
  loading: boolean;
}) => {
  const scrollRef = useDragScroll();

  if (loading) {
    return (
      <div className="top-sellers-skeleton">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Skeleton.Avatar active size={76} />
            <Skeleton.Input
              active
              style={{ width: "60px", height: "12px" }}
              size="small"
            />
          </div>
        ))}
      </div>
    );
  }

  if (!sellers.length) return null;

  return (
    <div ref={scrollRef} className="top-sellers-scroll hide-scrollbar">
      {sellers.map((seller) => (
        <SellerAvatar key={seller.id} seller={seller} />
      ))}
    </div>
  );
};

// ─── Community (Top Bidders + Trending + Wishlisted + Live Activity) ─────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function useAutoScroll(speed: number) {
  const ref = useDragScrollY();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let animationId: number;
    let isPaused = false;
    let atBoundary = false;
    let boundaryTimeout: ReturnType<typeof setTimeout>;
    let userScrollTimeout: ReturnType<typeof setTimeout>;
    let direction = 1;
    let pos = el.scrollTop;

    const scroll = () => {
      if (!isPaused && !atBoundary) {
        pos += direction * speed;
        el.scrollTop = pos;
        if (direction === 1 && pos + el.clientHeight >= el.scrollHeight) {
          atBoundary = true;
          boundaryTimeout = setTimeout(() => {
            direction = -1;
            atBoundary = false;
          }, 1000);
        } else if (direction === -1 && pos <= 0) {
          atBoundary = true;
          boundaryTimeout = setTimeout(() => {
            direction = 1;
            atBoundary = false;
          }, 1000);
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    const handleMouseEnter = () => {
      isPaused = true;
    };
    const handleMouseLeave = () => {
      isPaused = false;
    };
    const handleWheel = () => {
      isPaused = true;
      clearTimeout(userScrollTimeout);
      userScrollTimeout = setTimeout(() => {
        isPaused = false;
      }, 3000);
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("wheel", handleWheel);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(boundaryTimeout);
      clearTimeout(userScrollTimeout);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [speed]);

  return ref;
}

const RankedCol = ({
  icon,
  title,
  items,
  loading,
  metaFn,
  scrollSpeed = 0.5,
}: {
  icon: string;
  title: string;
  items: Auction[];
  loading: boolean;
  metaFn: (a: Auction) => React.ReactNode;
  scrollSpeed?: number;
}) => {
  const navigate = useNavigate();
  const bodyRef = useAutoScroll(scrollSpeed);

  return (
    <div className="community-col">
      <div className="community-col-header">
        <span className="community-col-icon">{icon}</span>
        <p className="community-col-title">{title}</p>
      </div>
      <div ref={bodyRef} className="community-col-body">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="community-row">
                <Skeleton.Avatar
                  active
                  size={36}
                  shape="square"
                  style={{ borderRadius: 8 }}
                />
                <Skeleton active title={{ width: "80%" }} paragraph={false} />
              </div>
            ))
          : items.map((a, i) => (
              <div
                key={a.id}
                className="community-row"
                onClick={() => navigate(`/auction/${a.id}`)}
              >
                <span className={`community-row-rank${i < 3 ? " top3" : ""}`}>
                  {i + 1}
                </span>
                <img
                  src={getImageUrl(a.image) || DEFAULT_AUCTION_IMAGE}
                  alt={a.title}
                  className="community-row-thumb"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
                  }}
                />
                <div className="community-row-info">
                  <p className="community-row-title">{a.title}</p>
                  <p className="community-row-sub">{metaFn(a)}</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

const FeedCol = ({
  loading,
  feed,
}: {
  loading: boolean;
  feed: RecentBidFeedResponse[];
}) => {
  const navigate = useNavigate();
  const bodyRef = useAutoScroll(0.375);

  return (
    <div className="community-col">
      <div className="community-col-header">
        <span className="community-col-icon">⚡</span>
        <p className="community-col-title">Live Activity</p>
      </div>
      <div ref={bodyRef} className="community-col-body">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="community-feed-item">
                <Skeleton.Avatar active size={28} />
                <Skeleton
                  active
                  title={{ width: "60%" }}
                  paragraph={{ rows: 1, width: "80%" }}
                />
              </div>
            ))
          : feed.map((bid, i) => {
              const fallback = `https://ui-avatars.com/api/?background=2a2d3e&color=fed469&bold=true&size=64&name=${encodeURIComponent(bid.bidderName)}`;
              const src = bid.bidderAvatarUrl
                ? getAvatarUrl(bid.bidderAvatarUrl)
                : fallback;
              return (
                <div
                  key={i}
                  className="community-feed-item"
                  onClick={() => navigate(`/auction/${bid.auctionId}`)}
                >
                  <img
                    src={src}
                    alt={bid.bidderName}
                    className="community-feed-avatar"
                    onError={(e) => {
                      e.currentTarget.src = fallback;
                    }}
                  />
                  <div className="community-feed-body">
                    <p className="community-feed-who">{bid.bidderName}</p>
                    <p className="community-feed-what">{bid.auctionTitle}</p>
                    <p className="community-feed-amount">
                      {formatCurrency(bid.amount)}
                    </p>
                  </div>
                  <span className="community-feed-time">
                    {timeAgo(bid.createdAt)}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
};

const CommunitySection = ({
  bidders,
  biddersLoading,
  trending,
  trendingLoading,
  wishlisted,
  wishlistedLoading,
  feed,
  feedLoading,
}: {
  bidders: TopBidderPublicResponse[];
  biddersLoading: boolean;
  trending: Auction[];
  trendingLoading: boolean;
  wishlisted: Auction[];
  wishlistedLoading: boolean;
  feed: RecentBidFeedResponse[];
  feedLoading: boolean;
}) => {
  const stripRef = useDragScroll();

  const BidderStrip = () => (
    <div ref={stripRef} className="community-bidders-strip hide-scrollbar">
      {biddersLoading
        ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 7,
                flexShrink: 0,
              }}
            >
              <Skeleton.Avatar active size={54} />
              <Skeleton.Input
                active
                size="small"
                style={{ width: 48, height: 10 }}
              />
            </div>
          ))
        : bidders.map((b, i) => {
            const fallback = `https://ui-avatars.com/api/?background=2a2d3e&color=fed469&bold=true&size=128&name=${encodeURIComponent(b.name)}`;
            const src = b.avatarUrl ? getAvatarUrl(b.avatarUrl) : fallback;
            return (
              <div key={b.id} className="community-bidder-item">
                <div
                  className={`community-bidder-ring${i >= 3 ? " muted" : ""}`}
                >
                  <img
                    src={src}
                    alt={b.name}
                    className="community-bidder-avatar"
                    onError={(e) => {
                      e.currentTarget.src = fallback;
                    }}
                  />
                  {i < 3 && (
                    <span className="community-bidder-rank">{i + 1}</span>
                  )}
                </div>
                <p className="community-bidder-name">{b.name}</p>
                <p className="community-bidder-wins">
                  {b.totalWins} Wins · {b.totalBids} Bids
                </p>
              </div>
            );
          })}
    </div>
  );

  return (
    <div className="community-panel">
      <div
        className="community-col-header-bidders"
        style={{ borderBottom: "none", paddingBottom: 0 }}
      >
        <span className="community-col-icon">🏆</span>
        <p className="community-col-title-bidders">Top Bidders</p>
      </div>
      <BidderStrip />
      <div className="community-bottom">
        <RankedCol
          icon="🔥"
          title="Hot Right Now"
          items={trending}
          loading={trendingLoading}
          scrollSpeed={0.25}
          metaFn={(a) => (
            <>
              <span className="community-row-sub-accent">
                {formatCurrency(a.currentPrice)}
              </span>{" "}
              · {a.status === AuctionStatus.LIVE ? "LIVE" : "ENDED"}
            </>
          )}
        />
        <RankedCol
          icon="❤️"
          title="Most Wishlisted"
          items={wishlisted}
          loading={wishlistedLoading}
          scrollSpeed={0.25}
          metaFn={(a) => (
            <span className="community-row-sub-accent">
              {formatCurrency(a.currentPrice)}
            </span>
          )}
        />
        <FeedCol loading={feedLoading} feed={feed} />
      </div>
    </div>
  );
};

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { icon: "⌚", label: "Watches" },
  { icon: "🎨", label: "Fine Art" },
  { icon: "🚗", label: "Classic Cars" },
  { icon: "💎", label: "Jewelry" },
  { icon: "📱", label: "Electronics" },
  { icon: "🏠", label: "Real Estate" },
];

// ─── Section header component ─────────────────────────────────────────────────

const SectionHeader = ({
  title,
  linkTo,
}: {
  title: string;
  linkTo?: string;
}) => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#fff",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {linkTo && (
        <span
          onClick={() => navigate(linkTo)}
          style={{
            cursor: "pointer",
            color: "rgba(255,255,255,0.35)",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "color 0.15s",
            userSelect: "none",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLSpanElement).style.color = "#FED469")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLSpanElement).style.color =
              "rgba(255,255,255,0.35)")
          }
        >
          See all <ArrowRightOutlined style={{ fontSize: "10px" }} />
        </span>
      )}
    </div>
  );
};

// ─── Recently Bid Section ────────────────────────────────────────────────────

const RecentlyBidSection = ({
  auctions,
  loading,
  onCountdownComplete,
}: HScrollProps) => {
  const scrollRef = useDragScroll();

  if (loading) {
    return (
      <div style={{ display: "flex", gap: "16px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ minWidth: "240px", flexShrink: 0 }}>
            <Skeleton.Image
              active
              style={{ width: "240px", height: "160px", borderRadius: "12px" }}
            />
            <Skeleton
              active
              paragraph={{ rows: 2 }}
              style={{ marginTop: "8px" }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!auctions.length) return null;

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        gap: "16px",
        overflowX: "auto",
        paddingTop: "8px",
        paddingBottom: "16px",
        paddingRight: "8px",
        userSelect: "none",
      }}
      className="hide-scrollbar"
    >
      {auctions.map((auction) => (
        <div
          key={auction.id}
          style={{
            minWidth: "240px",
            maxWidth: "260px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AuctionCard
            auction={auction}
            onCountdownComplete={onCountdownComplete}
          />
        </div>
      ))}
    </div>
  );
};

// ─── My Bids Section ─────────────────────────────────────────────────────────

type BidParticipation = "leading" | "outbid" | "won";

function deriveBidStatus(bid: MyBidHistoryResponse): BidParticipation {
  if (bid.auctionStatus === AuctionStatus.LIVE) {
    return bid.amount >= bid.currentPrice ? "leading" : "outbid";
  }
  return bid.amount >= bid.currentPrice ? "won" : "outbid";
}

const BID_STATUS_META: Record<
  BidParticipation,
  {
    label: string;
    className: string;
    bg: string;
    border: string;
    glow: string;
  }
> = {
  leading: {
    label: "Leading",
    className: "bid-status-leading",
    bg: "rgba(74,222,128,0.07)",
    border: "rgba(74,222,128,0.28)",
    glow: "rgba(74,222,128,0.18)",
  },
  outbid: {
    label: "Outbid",
    className: "bid-status-outbid",
    bg: "rgba(248,113,113,0.07)",
    border: "rgba(248,113,113,0.28)",
    glow: "rgba(248,113,113,0.14)",
  },
  won: {
    label: "Won",
    className: "bid-status-won",
    bg: "rgba(254,212,105,0.07)",
    border: "rgba(254,212,105,0.28)",
    glow: "rgba(254,212,105,0.2)",
  },
};

const MyBidPoster = ({
  bid,
  onClick,
}: {
  bid: MyBidHistoryResponse;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const participation = deriveBidStatus(bid);
  const isWinning = participation === "leading" || participation === "won";
  const imgSrc = bid.image ? getImageUrl(bid.image) : DEFAULT_AUCTION_IMAGE;

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="my-bid-poster"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="my-bid-poster-image-wrap">
        <img
          src={imgSrc}
          alt={bid.auctionTitle}
          className="my-bid-poster-img"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
          }}
        />
        <div className="my-bid-poster-overlay" />
        <span className={`my-bid-poster-badge ${participation}`}>
          {BID_STATUS_META[participation].label}
        </span>
      </div>
      <p className="my-bid-poster-title">{bid.auctionTitle}</p>
      <p className="my-bid-poster-amount-text">{formatCurrency(bid.amount)}</p>

      {hovered &&
        createPortal(
          <div className="my-bid-preview" style={{ left: pos.x, top: pos.y }}>
            <div style={{ position: "relative" }}>
              <img
                src={imgSrc}
                alt={bid.auctionTitle}
                className="my-bid-preview-img"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
                }}
              />
              <div className="my-bid-preview-img-overlay" />
            </div>
            <div className="my-bid-preview-body">
              <p className="my-bid-preview-title">{bid.auctionTitle}</p>
              <div className="my-bid-preview-divider" />
              <div className="my-bid-preview-row">
                <p className="my-bid-preview-label">My Bid</p>
                <p className="my-bid-preview-value">
                  {formatCurrency(bid.amount)}
                </p>
              </div>
              <div className="my-bid-preview-row">
                <p className="my-bid-preview-label">Current Price</p>
                <p
                  className={`my-bid-preview-value${isWinning ? " accent" : ""}`}
                >
                  {formatCurrency(bid.currentPrice)}
                </p>
              </div>
              <div className="my-bid-preview-divider" />
              <div className="my-bid-preview-row">
                <p className="my-bid-preview-label">Status</p>
                <span
                  className={`bid-status-badge ${BID_STATUS_META[participation].className}`}
                >
                  {BID_STATUS_META[participation].label}
                </span>
              </div>
              <div className="my-bid-preview-row">
                <p className="my-bid-preview-label">Bid Date</p>
                <p
                  className="my-bid-preview-value"
                  style={{ fontSize: "11px" }}
                >
                  {new Date(bid.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

const MyBidsSection = ({
  bids,
  loading,
  onNavigate,
}: {
  bids: MyBidHistoryResponse[];
  loading: boolean;
  onNavigate: (id: number) => void;
}) => {
  const scrollRef = useDragScroll();

  if (loading) {
    return (
      <div style={{ display: "flex", gap: "12px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ flexShrink: 0, width: 200 }}>
            <Skeleton.Image
              active
              style={{ width: 200, height: 150, borderRadius: 12 }}
            />
            <Skeleton
              active
              title={{ width: "100%" }}
              paragraph={{ rows: 1, width: "60%" }}
              style={{ marginTop: 8 }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!bids.length)
    return (
      <Empty
        description={
          <span style={{ color: "var(--color-text-muted)" }}>
            No auctions participated yet
          </span>
        }
      />
    );

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        gap: "12px",
        overflowX: "auto",
        paddingBottom: "8px",
        userSelect: "none",
      }}
      className="hide-scrollbar"
    >
      {bids.map((bid) => (
        <MyBidPoster
          key={bid.createdAt}
          bid={bid}
          onClick={() => onNavigate(bid.auctionId)}
        />
      ))}
    </div>
  );
};

// ─── Horizontal scroll section ────────────────────────────────────────────────

interface HScrollProps {
  auctions: Auction[];
  loading: boolean;
  onCountdownComplete: () => void;
}

const HScrollSection = ({
  auctions,
  loading,
  onCountdownComplete,
}: HScrollProps) => {
  const scrollRef = useDragScroll();

  if (loading) {
    return (
      <div style={{ display: "flex", gap: "16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ minWidth: "240px", flexShrink: 0 }}>
            <Skeleton.Image
              active
              style={{ width: "240px", height: "160px", borderRadius: "12px" }}
            />
            <Skeleton
              active
              paragraph={{ rows: 2 }}
              style={{ marginTop: "8px" }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!auctions.length) return null;

  return (
    <div>
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingTop: "8px",
          paddingBottom: "16px",
          paddingRight: "8px",
          userSelect: "none",
        }}
        className="hide-scrollbar"
      >
        {auctions.map((auction) => (
          <div
            key={auction.id}
            style={{
              minWidth: "240px",
              maxWidth: "260px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <AuctionCard
              auction={auction}
              onCountdownComplete={onCountdownComplete}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Hero Slide ───────────────────────────────────────────────────────────────

const HeroSlide = ({ auction }: { auction: Auction }) => {
  const navigate = useNavigate();
  const { wishlistedSet } = useWishlistBatch([auction.id]);
  const isWishListed = wishlistedSet.has(auction.id);
  const { toggleWishlist, isLoading: isWishlistLoading } = useWishlist(
    auction.id,
    isWishListed,
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(440px, 55vw, 640px)",
      }}
    >
      {/* Background image */}
      <img
        src={getImageUrl(auction.image) || DEFAULT_AUCTION_IMAGE}
        alt={auction.title}
        onError={(e) => {
          e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          backgroundColor: "var(--color-bg)", // Màu nền chờ
          color: "transparent", // Ẩn alt text và icon lỗi mặc định
        }}
      />

      {/* Top gradient — reduced opacity to let image shine through */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "180px",
          background:
            "linear-gradient(to bottom, rgba(25,27,36,0.9) 0%, rgba(25,27,36,0.4) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Bottom gradient — content readability */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "70%",
          background:
            "linear-gradient(to top, #191b24 0%, rgba(25,27,36,0.85) 40%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Left gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "50%",
          background:
            "linear-gradient(to right, rgba(25,27,36,0.9) 0%, rgba(25,27,36,0.4) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Right gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "30%",
          background:
            "linear-gradient(to left, rgba(25,27,36,0.6) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 24px clamp(32px, 5vw, 56px) clamp(16px, 4vw, 48px)",
          width: "100%",
          maxWidth: "45%",
          minWidth: "min(100%, 450px)",
        }}
      >
        {/* LIVE badge */}
        {auction.status === AuctionStatus.LIVE && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(239,68,68,0.85)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              padding: "4px 12px",
              borderRadius: "100px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#fff",
                animation: "pulseDot 1.4s ease-in-out infinite",
              }}
            />
            Live Now
          </div>
        )}

        {/* Title */}
        <h2
          style={{
            fontSize: "clamp(1.3rem, 3.5vw, 2.4rem)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: "0 0 16px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          {auction.title}
        </h2>

        {/* Description */}
        <div
          style={{
            fontSize: "14px",
            color: "#fff",
            lineHeight: 1.6,
            marginBottom: "24px",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            fontWeight: 400,
          }}
          dangerouslySetInnerHTML={{
            __html: auction.description || "No description provided.",
          }}
        />

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Price */}
          <div>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 3px",
              }}
            >
              {auction.status === AuctionStatus.LIVE
                ? "Current Price"
                : auction.status === AuctionStatus.SCHEDULED
                  ? "Starting Price"
                  : "Final Price"}
            </p>
            <p
              style={{
                fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                fontWeight: 800,
                color: "#FED469",
                letterSpacing: "-0.025em",
                margin: 0,
                textShadow: "0 0 20px rgba(254,212,105,0.35)",
              }}
            >
              {formatCurrency(auction.currentPrice)}
            </p>
          </div>

          {(auction.status === AuctionStatus.LIVE ||
            auction.status === AuctionStatus.SCHEDULED) && (
            <>
              <div
                style={{
                  width: "1px",
                  height: "36px",
                  background: "rgba(255,255,255,0.12)",
                }}
              />

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <ClockCircleOutlined
                  style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}
                />
                <div>
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.45)",
                      margin: "0 0 1px",
                    }}
                  >
                    Time Left
                  </p>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "0.04em",
                      fontVariantNumeric: "tabular-nums",
                      margin: 0,
                    }}
                  >
                    <Countdown
                      compact
                      targetTime={auction.endTime}
                      isLive={auction.status === AuctionStatus.LIVE}
                    />
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Seller */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "1px",
                height: "36px",
                background: "rgba(255,255,255,0.12)",
              }}
            />
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  margin: "0 0 1px",
                }}
              >
                Seller
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                  margin: 0,
                }}
              >
                {auction.seller?.name || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {auction.status === AuctionStatus.LIVE ? (
            <Button
              icon={<RiseOutlined />}
              type="primary"
              size="large"
              onClick={() => navigate(`/auction/${auction.id}`)}
              style={{
                height: "44px",
                padding: "0 28px",
                fontSize: "14px",
              }}
            >
              Place Bid
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(`/auction/${auction.id}`)}
              style={{
                height: "44px",
                padding: "0 28px",
                fontSize: "14px",
              }}
            >
              View Details
            </Button>
          )}
          <Button
            icon={
              isWishListed ? (
                <HeartFilled style={{ color: "#ef4444" }} />
              ) : (
                <HeartOutlined />
              )
            }
            size="large"
            loading={isWishlistLoading}
            onClick={toggleWishlist}
            style={{
              height: "44px",
              padding: "0 20px",
            }}
          ></Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const HomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const carouselRef = useRef<any>(null);

  // ── Data fetching (logic unchanged) ──────────────────────────
  const { data: configuredHeroSlides = [], isLoading: heroSlidesLoading } =
    useQuery({
      queryKey: ["public-hero-slides"],
      queryFn: heroSlideApi.getPublicHeroSlides,
      staleTime: 2 * 60 * 1000,
    });

  const { data: liveData, isLoading: liveLoading } = useAuctions(
    AuctionStatus.LIVE,
    1,
    20,
  );
  const { data: scheduledData, isLoading: scheduledLoading } = useAuctions(
    AuctionStatus.SCHEDULED,
    1,
    10,
  );

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist", 1],
    queryFn: () => wishlistApi.getMyWishList(1, 5),
    enabled: isAuthenticated,
  });

  const { data: topSellers = [], isLoading: topSellersLoading } = useQuery({
    queryKey: ["top-sellers-public"],
    queryFn: () => userApi.getPublicTopSellers(12),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentBidAuctions = [], isLoading: recentBidLoading } =
    useQuery({
      queryKey: ["my-recent-bid-auctions"],
      queryFn: () => auctionApi.getMyRecentBidAuctions(10),
      enabled: isAuthenticated,
      staleTime: 60 * 1000,
    });

  const { data: topBidders = [], isLoading: topBiddersLoading } = useQuery({
    queryKey: ["top-bidders-public"],
    queryFn: () => userApi.getPublicTopBidders(15),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingAuctions = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-auctions"],
    queryFn: () => auctionApi.getTrendingAuctions(10),
    staleTime: 2 * 60 * 1000,
  });

  const { data: mostWishlisted = [], isLoading: wishlistedLoading } = useQuery({
    queryKey: ["most-wishlisted-auctions"],
    queryFn: () => auctionApi.getMostWishlistedAuctions(10),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentPublicBids = [], isLoading: recentPublicBidsLoading } =
    useQuery({
      queryKey: ["recent-public-bids"],
      queryFn: () => bidApi.getRecentPublicBids(15),
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    });

  const { data: bidHistoryData, isLoading: bidHistoryLoading } = useQuery({
    queryKey: ["my-bid-history-home"],
    queryFn: () => bidApi.getMyBidHistory(1, 10),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const { data: endedData, isLoading: endedLoading } = useAuctions(
    AuctionStatus.ENDED,
    1,
    10,
  );

  const onPriceUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  const { isConnected } = useWebSocket({ onPriceUpdate });

  const handleCountdownComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  // ── Derived data ──────────────────────────────────────────────
  const liveAuctions = liveData?.data ?? [];
  const heroAuctions = useMemo(
    () =>
      configuredHeroSlides.length > 0
        ? configuredHeroSlides
        : liveAuctions.slice(0, 5),
    [configuredHeroSlides, liveAuctions],
  );
  const endingSoon = useMemo(
    () => liveAuctions.filter((a) => isEndingSoon(a.endTime)),
    [liveAuctions],
  );
  const scheduledAuctions = scheduledData?.data ?? [];

  const myBids = useMemo(() => bidHistoryData?.data ?? [], [bidHistoryData]);

  const endedAuctions = endedData?.data ?? [];

  const hasHero = liveLoading || heroSlidesLoading || heroAuctions.length > 0;

  return (
    <div
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ══ HERO BANNER — 100vw, goes behind semi-transparent header ══ */}
      {hasHero && (
        <section
          style={{
            width: "100%",
            position: "relative",
            zIndex: 0,
          }}
        >
          {liveLoading ? (
            <div
              style={{
                width: "100%",
                height: "clamp(440px, 55vw, 640px)",
                backgroundColor: "var(--color-bg)",
                backgroundImage:
                  "linear-gradient(to bottom, var(--color-surface), var(--color-bg))",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding:
                    "0 24px clamp(32px, 5vw, 56px) clamp(16px, 4vw, 48px)",
                  width: "100%",
                  maxWidth: "45%",
                  minWidth: "min(100%, 450px)",
                }}
              >
                <Skeleton.Button
                  active
                  style={{
                    width: 80,
                    height: 20,
                    borderRadius: 100,
                    marginBottom: 16,
                  }}
                />
                <Skeleton
                  active
                  title={{ width: "90%" }}
                  paragraph={{ rows: 2, width: ["100%", "70%"] }}
                />
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "32px" }}
                >
                  <Skeleton.Button active style={{ width: 140, height: 44 }} />
                  <Skeleton.Button active style={{ width: 64, height: 44 }} />
                </div>
              </div>
            </div>
          ) : (
            <Carousel
              ref={carouselRef}
              autoplay
              autoplaySpeed={6000}
              dots={{ className: "hero-dots" }}
              customPaging={(i) => {
                const auction = heroAuctions[i];
                if (!auction) return <div className="thumbnail-dot" />;

                const imageUrl = auction.image
                  ? getImageUrl(auction.image)
                  : null;

                return (
                  <div className="thumbnail-dot">
                    <img
                      src={imageUrl || DEFAULT_AUCTION_IMAGE}
                      alt={`Thumbnail ${i}`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          DEFAULT_AUCTION_IMAGE;
                      }}
                    />
                  </div>
                );
              }}
              effect="fade"
              swipe
              draggable
              touchThreshold={10}
              style={{ cursor: "pointer" }}
            >
              {heroAuctions.map((auction) => (
                <HeroSlide key={auction.id} auction={auction} />
              ))}
            </Carousel>
          )}
        </section>
      )}

      {/* ══ CONTENT SECTIONS ══ */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        {/* ── Live Now ── */}
        <LazySection minHeight={280}>
          <section style={{ marginBottom: "52px" }}>
            <SectionHeader title="Live Now" linkTo="/auctions?status=live" />
            {liveAuctions.length > 0 ? (
              <HScrollSection
                auctions={liveAuctions}
                loading={liveLoading}
                onCountdownComplete={handleCountdownComplete}
              />
            ) : (
              !liveLoading && (
                <Empty
                  description={
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>
                      No live auctions at the moment
                    </span>
                  }
                />
              )
            )}
          </section>
        </LazySection>

        {/* ── Ending Soon ── */}
        {(liveLoading || endingSoon.length > 0) && (
          <LazySection minHeight={280}>
            <section style={{ marginBottom: "52px" }}>
              <SectionHeader
                title="Ending Soon"
                linkTo="/auctions?status=live"
              />
              <HScrollSection
                auctions={endingSoon}
                loading={liveLoading}
                onCountdownComplete={handleCountdownComplete}
              />
            </section>
          </LazySection>
        )}

        {/* ── Categories ── */}
        <LazySection minHeight={200}>
          <section style={{ marginBottom: "52px" }}>
            <SectionHeader title="Categories" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
              }}
              className="sm:grid-cols-6"
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => navigate(`/auctions`)}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "var(--radius-md)",
                    padding: "20px 8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s",
                    color: "rgba(255,255,255,0.55)",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "rgba(254,212,105,0.25)";
                    el.style.background = "rgba(254,212,105,0.04)";
                    el.style.color = "#FED469";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "rgba(255,255,255,0.06)";
                    el.style.background = "var(--color-surface)";
                    el.style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  <span style={{ fontSize: "24px", lineHeight: 1 }}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </section>
        </LazySection>

        {/* ── Recently Bid ── */}
        {isAuthenticated &&
          (recentBidLoading || recentBidAuctions.length > 0) && (
            <LazySection minHeight={280}>
              <section style={{ marginBottom: "52px" }}>
                <SectionHeader title="Recently Bid" linkTo="/participated" />
                <RecentlyBidSection
                  auctions={recentBidAuctions}
                  loading={recentBidLoading}
                  onCountdownComplete={handleCountdownComplete}
                />
              </section>
            </LazySection>
          )}

        {/* ── Community (Top Bidders + Trending + Wishlisted + Feed) ── */}
        <LazySection minHeight={420}>
          <section style={{ marginBottom: "52px" }}>
            <CommunitySection
              bidders={topBidders}
              biddersLoading={topBiddersLoading}
              trending={trendingAuctions}
              trendingLoading={trendingLoading}
              wishlisted={mostWishlisted}
              wishlistedLoading={wishlistedLoading}
              feed={recentPublicBids}
              feedLoading={recentPublicBidsLoading}
            />
          </section>
        </LazySection>

        {/* ── Upcoming ── */}
        <LazySection minHeight={280}>
          <section style={{ marginBottom: "52px" }}>
            <SectionHeader
              title="Coming Up"
              linkTo="/auctions?status=scheduled"
            />
            {scheduledAuctions.length > 0 ? (
              <HScrollSection
                auctions={scheduledAuctions}
                loading={scheduledLoading}
                onCountdownComplete={handleCountdownComplete}
              />
            ) : (
              !scheduledLoading && (
                <Empty
                  description={
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>
                      No upcoming auctions
                    </span>
                  }
                />
              )
            )}
          </section>
        </LazySection>

        {/* ── My Bids ── */}
        {isAuthenticated && (bidHistoryLoading || myBids.length > 0) && (
          <LazySection minHeight={160}>
            <section style={{ marginBottom: "52px" }}>
              <SectionHeader title="My Bids" linkTo="/account/bids" />
              <MyBidsSection
                bids={myBids}
                loading={bidHistoryLoading}
                onNavigate={(id) => navigate(`/auction/${id}`)}
              />
            </section>
          </LazySection>
        )}

        {/* ── Recently Ended ── */}
        {(endedLoading || endedAuctions.length > 0) && (
          <LazySection minHeight={280}>
            <section style={{ marginBottom: "52px" }}>
              <SectionHeader
                title="Recently Ended"
                linkTo="/auctions?status=ended"
              />
              <HScrollSection
                auctions={endedAuctions}
                loading={endedLoading}
                onCountdownComplete={handleCountdownComplete}
              />
            </section>
          </LazySection>
        )}

        {/* ── Top Sellers ── */}
        {topSellersLoading || topSellers.length > 0 ? (
          <LazySection minHeight={140}>
            <section style={{ marginBottom: "52px" }}>
              <SectionHeader title="Top Sellers" />
              <TopSellersSection
                sellers={topSellers}
                loading={topSellersLoading}
              />
            </section>
          </LazySection>
        ) : null}

        {/* ── Wishlist preview ── */}
        {isAuthenticated && wishlistData && wishlistData.data.length > 0 && (
          <LazySection minHeight={280}>
            <section style={{ marginBottom: "52px" }}>
              <SectionHeader title="Wishlist" linkTo="/account/wishlist" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                {wishlistData.data.map((item) => (
                  <AuctionCard
                    key={item.auctionId}
                    auction={{
                      id: item.auctionId,
                      title: item.title,
                      description: "",
                      image: item.image,
                      startPrice: item.startPrice,
                      currentPrice: item.currentPrice,
                      minStep: 0,
                      status: item.status,
                      startTime: item.startTime,
                      endTime: item.endTime,
                      antiSnipeSeconds: 0,
                      extensionSeconds: 0,
                      privateMode: item.privateMode,
                      seller: {
                        id: 0,
                        email: "",
                        name: item.sellerName ?? "Unknown",
                        roles: [],
                      },
                      createdAt: item.createdAt,
                    }}
                    onCountdownComplete={handleCountdownComplete}
                  />
                ))}
              </div>
            </section>
          </LazySection>
        )}
      </div>
    </div>
  );
};

export default HomePage;

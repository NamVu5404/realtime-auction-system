import { LockOutlined, WifiOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Empty, Pagination, Spin } from "antd";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { auctionApi } from "../../api/auctionApi";
import { Auction } from "../../api/types";
import AuctionCard from "../../features/auction/AuctionCard";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuthStore } from "../../store/useAuthStore";

const PAGE_SIZE = 20;

const getAuctionToken = (auctionId: number): string | null =>
  (
    JSON.parse(localStorage.getItem("auction_tokens") ?? "{}") as Record<
      string,
      string
    >
  )[auctionId] ?? null;

const LockedGridCard = ({ auction }: { auction: Auction }) => (
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

const ParticipatedAuctionsPage = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["participated-auctions", currentPage],
    queryFn: () => auctionApi.getMyParticipatedAuctions(currentPage, PAGE_SIZE),
    enabled: isAuthenticated,
  });

  const onPriceUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["participated-auctions"] });
  }, [queryClient]);

  const { isConnected } = useWebSocket({ onPriceUpdate });

  const handlePageChange = useCallback(
    (p: number) => setSearchParams({ page: p.toString() }),
    [setSearchParams],
  );

  const handleCountdownComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["participated-auctions"] });
  }, [queryClient]);

  const auctions = data?.data ?? [];
  const totalElements = data?.totalElements ?? 0;

  return (
    <div
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        padding: "40px 0",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1280px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: "0 0 4px",
                }}
              >
                Participated Auctions
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
                All auctions you have placed at least one bid on
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <Spin spinning={isLoading}>
          {!isLoading && auctions.length === 0 ? (
            <div className="auctions-grid-empty">
              <Empty
                description={
                  <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                    You haven&apos;t participated in any auctions yet
                  </span>
                }
              />
            </div>
          ) : (
            <>
              <div className="auctions-grid-5">
                {auctions.map((auction) =>
                  auction.privateMode && !getAuctionToken(auction.id) ? (
                    <LockedGridCard key={auction.id} auction={auction} />
                  ) : (
                    <AuctionCard
                      key={auction.id}
                      auction={auction}
                      onCountdownComplete={handleCountdownComplete}
                    />
                  ),
                )}
              </div>
              {totalElements > PAGE_SIZE && (
                <div className="auctions-grid-pagination">
                  <Pagination
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={totalElements}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showTotal={(total) => `${total} auctions`}
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default ParticipatedAuctionsPage;

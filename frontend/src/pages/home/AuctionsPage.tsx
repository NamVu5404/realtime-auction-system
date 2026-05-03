import { WifiOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Empty, Spin, Tabs } from "antd";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AuctionStatus } from "../../api/types";
import AuctionList from "../../features/auction/AuctionList";
import { useAuctions } from "../../hooks/useAuctions";
import { useWebSocket } from "../../hooks/useWebSocket";

/**
 * /auctions — full browse page with LIVE / UPCOMING / ENDED tabs.
 * Logic copied directly from original HomePage; only layout differs.
 */
const AuctionsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("status") || "live";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("q") || undefined;
  const pageSize = 20;

  const statusMap: Record<string, AuctionStatus> = {
    live: AuctionStatus.LIVE,
    scheduled: AuctionStatus.SCHEDULED,
    ended: AuctionStatus.ENDED,
  };

  const currentStatus = statusMap[activeTab] || AuctionStatus.LIVE;

  const { data, isLoading, error } = useAuctions(
    currentStatus,
    currentPage,
    pageSize,
    searchQuery,
  );

  const onPriceUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  const { isConnected } = useWebSocket({ onPriceUpdate });

  const handleCountdownComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  const handleTabChange = useCallback(
    (key: string) =>
      setSearchParams({
        status: key,
        page: "1",
        ...(searchQuery ? { q: searchQuery } : {}),
      }),
    [setSearchParams, searchQuery],
  );

  const handlePageChange = useCallback(
    (p: number) =>
      setSearchParams({
        status: activeTab,
        page: p.toString(),
        ...(searchQuery ? { q: searchQuery } : {}),
      }),
    [activeTab, setSearchParams, searchQuery],
  );

  const renderContent = (emptyMsg: string) => (
    <Spin spinning={isLoading}>
      {!isLoading && data?.data && data.data.length > 0 ? (
        <AuctionList
          auctions={data.data}
          onCountdownComplete={handleCountdownComplete}
          currentPage={data.currentPage}
          pageSize={data.pageSize}
          totalElements={data.totalElements}
          onPageChange={handlePageChange}
          gridSpan={{ xs: 12, sm: 12, md: 8, lg: 6 }}
        />
      ) : (
        !isLoading && (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <Empty
              description={
                <span
                  style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}
                >
                  {emptyMsg}
                </span>
              }
            />
          </div>
        )
      )}
    </Spin>
  );

  const tabs = [
    {
      key: "live",
      label:
        activeTab === "live" ? `LIVE (${data?.totalElements ?? 0})` : "LIVE",
      children: renderContent("No live auctions at the moment"),
    },
    {
      key: "scheduled",
      label:
        activeTab === "scheduled"
          ? `UPCOMING (${data?.totalElements ?? 0})`
          : "UPCOMING",
      children: renderContent("No upcoming auctions"),
    },
    {
      key: "ended",
      label:
        activeTab === "ended" ? `ENDED (${data?.totalElements ?? 0})` : "ENDED",
      children: renderContent("No ended auctions"),
    },
  ];

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
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#fff",
                margin: 0,
              }}
            >
              {searchQuery ? (
                <>
                  Results for{" "}
                  <span style={{ color: "var(--color-gold-start)" }}>
                    &#34;{searchQuery}&#34;
                  </span>
                </>
              ) : (
                "All Auctions"
              )}
            </h2>
            {isConnected ? (
              <span className="status-pill status-pill-connected">
                <WifiOutlined style={{ fontSize: "11px" }} />
                Real-time active
              </span>
            ) : (
              <span className="status-pill status-pill-reconnecting">
                <span
                  style={{
                    display: "inline-block",
                    animation: "spin 1s linear infinite",
                  }}
                >
                  ⟳
                </span>
                Connecting...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "24px",
              padding: "14px 18px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px",
              color: "#f87171",
              fontSize: "14px",
            }}
          >
            ⚠ Failed to load auctions: {error.message}
          </div>
        )}

        {searchQuery ? (
          <div style={{ marginTop: "24px" }}>
            {renderContent(`No results found for "${searchQuery}"`)}
          </div>
        ) : (
          <Tabs
            activeKey={
              Object.keys(statusMap).find(
                (k) => statusMap[k] === currentStatus,
              ) || "live"
            }
            onChange={handleTabChange}
            items={tabs}
            size="middle"
            className="auction-tabs"
            animated={false}
          />
        )}
      </div>
    </div>
  );
};

export default AuctionsPage;

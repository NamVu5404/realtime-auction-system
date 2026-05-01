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
  const pageSize = 20;

  const statusMap: Record<string, AuctionStatus> = {
    live: AuctionStatus.LIVE,
    scheduled: AuctionStatus.SCHEDULED,
    ended: AuctionStatus.ENDED,
  };

  const currentStatus = statusMap[activeTab] || AuctionStatus.LIVE;

  const { data, isLoading, error } = useAuctions(currentStatus, currentPage, pageSize);

  const onPriceUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  const { isConnected } = useWebSocket({ onPriceUpdate });

  const handleCountdownComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  const handleTabChange = useCallback(
    (key: string) => setSearchParams({ status: key, page: "1" }),
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (p: number) => setSearchParams({ status: activeTab, page: p.toString() }),
    [activeTab, setSearchParams],
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
        />
      ) : (
        !isLoading && (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <Empty
              description={
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>
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
      label: activeTab === "live" ? `LIVE (${data?.totalElements ?? 0})` : "LIVE",
      children: renderContent("No live auctions at the moment"),
    },
    {
      key: "scheduled",
      label: activeTab === "scheduled" ? `UPCOMING (${data?.totalElements ?? 0})` : "UPCOMING",
      children: renderContent("No upcoming auctions"),
    },
    {
      key: "ended",
      label: activeTab === "ended" ? `ENDED (${data?.totalElements ?? 0})` : "ENDED",
      children: renderContent("No ended auctions"),
    },
  ];

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh", paddingTop: "48px", paddingBottom: "64px" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>
                Browse
              </p>
              <h1
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  margin: 0,
                  background: "linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.5) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                All Auctions
              </h1>
            </div>
            {isConnected ? (
              <span className="status-pill status-pill-connected">
                <WifiOutlined style={{ fontSize: "11px" }} />
                Real-time active
              </span>
            ) : (
              <span className="status-pill status-pill-reconnecting">
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Connecting...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: "24px", padding: "14px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#f87171", fontSize: "14px" }}>
            ⚠ Failed to load auctions: {error.message}
          </div>
        )}

        <Tabs
          activeKey={Object.keys(statusMap).find((k) => statusMap[k] === currentStatus) || "live"}
          onChange={handleTabChange}
          items={tabs}
          size="large"
          className="auction-tabs"
          animated={false}
        />
      </div>
    </div>
  );
};

export default AuctionsPage;

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, Button, Space, Empty, Spin } from "antd";
import { WifiOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { AuctionStatus } from "../api/types";
import { useAuctions } from "../hooks/useAuctions";
import { useWebSocket } from "../hooks/useWebSocket";
import AuctionList from "../features/auction/AuctionList";

/**
 * Home Page Component
 *
 * Features:
 * - Tab-based filtering: LIVE, UPCOMING (SCHEDULED), ENDED
 * - Pagination support with React Query
 * - Real-time updates via WebSocket
 * - Automatic refetch when countdown reaches 00:00:00
 *
 * Tab Logic (Backend Driven):
 * - Tab "LIVE" → calls API with status=LIVE
 * - Tab "UPCOMING" → calls API with status=SCHEDULED
 * - Tab "ENDED" → calls API with status=ENDED
 *
 * Page indices: Frontend uses 1-based, Backend converts via Pageable
 */
export const HomePage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab and page from URL
  const activeTab = searchParams.get("status") || "live";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const pageSize = 20;

  // Map tab keys to backend status parameters
  const statusMap: Record<string, AuctionStatus> = {
    live: AuctionStatus.LIVE,
    scheduled: AuctionStatus.SCHEDULED,
    ended: AuctionStatus.ENDED,
  };

  const currentStatus = statusMap[activeTab] || AuctionStatus.LIVE;

  // Fetch auctions with React Query
  const { data, isLoading, error } = useAuctions(
    currentStatus,
    currentPage,
    pageSize,
  );

  // ✅ FIX: Stabilize callback WITHOUT depending on refetch (which changes on every render)
  const onPriceUpdate = useCallback(() => {
    // Use queryClient to invalidate instead of refetch
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  // WebSocket connection for real-time price updates
  const { isConnected } = useWebSocket({
    onPriceUpdate,
  });

  // Callback for when countdown reaches 00:00:00
  // Called from AuctionCard component
  const handleCountdownComplete = useCallback(() => {
    // Invalidate the auctions query to trigger a refetch
    // This ensures UI stays in sync with backend scheduler state transitions
    queryClient.invalidateQueries({ queryKey: ["auctions"] });
  }, [queryClient]);

  // Tab and page handlers with stable references
  const handleTabChange = useCallback(
    (key: string) => {
      setSearchParams({ status: key, page: "1" });
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (p: number) => {
      setSearchParams({ status: activeTab, page: p.toString() });
    },
    [activeTab, setSearchParams],
  );

  // Tab content renderer
  const renderTabContent = (emptyMsg: string) => (
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

  // Tab definitions with dynamic labels
  const tabs = [
    {
      key: "live",
      label:
        activeTab === "live" ? `LIVE (${data?.totalElements || 0})` : "LIVE",
      children: renderTabContent("No live auctions at the moment"),
    },
    {
      key: "scheduled",
      label:
        activeTab === "scheduled"
          ? `UPCOMING (${data?.totalElements || 0})`
          : "UPCOMING",
      children: renderTabContent("No upcoming auctions"),
    },
    {
      key: "ended",
      label:
        activeTab === "ended" ? `ENDED (${data?.totalElements || 0})` : "ENDED",
      children: renderTabContent("No ended auctions"),
    },
  ];

  return (
    <div
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        paddingTop: "48px",
        paddingBottom: "64px",
      }}
    >
      <div className="container max-w-7xl mx-auto px-6">
        {/* Hero Header */}
        <div
          style={{
            marginBottom: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: 0,
                background:
                  "linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.55) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Live Auctions
            </h1>

            {/* Connection status */}
            <div style={{ marginTop: "10px" }}>
              {isConnected ? (
                <span className="status-pill status-pill-connected">
                  <WifiOutlined style={{ fontSize: "11px" }} />
                  Real-time updates active
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
        </div>

        {/* Error Display */}
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

        {/* Tabs - Pill style via .auction-tabs CSS class */}
        <Tabs
          activeKey={
            Object.keys(statusMap).find(
              (k) => statusMap[k] === currentStatus,
            ) || "live"
          }
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

export default HomePage;

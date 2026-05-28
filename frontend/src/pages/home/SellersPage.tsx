import { CheckCircleFilled, SearchOutlined, ShopOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Col, Empty, Input, Pagination, Row, Skeleton } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auctionApi } from "../../api/auctionApi";
import { Auction, TopSellerPublicResponse } from "../../api/types";
import userApi from "../../api/userApi";
import AuctionCard from "../../features/auction/AuctionCard";
import { useDebounce } from "../../hooks/useDebounce";
import { getAvatarUrl } from "../../utils/imageUtils";
import { formatCurrency } from "../../utils/format";

// ─── Seller card in left panel ────────────────────────────────────────────────

const SellerCard = ({
  seller,
  selected,
  onClick,
}: {
  seller: TopSellerPublicResponse;
  selected: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      borderRadius: "var(--radius-md)",
      border: `1px solid ${selected ? "var(--color-gold-border)" : "var(--color-border-md)"}`,
      background: selected ? "var(--color-gold-subtle)" : "var(--color-surface)",
      cursor: "pointer",
      transition: "var(--transition)",
    }}
  >
    <img
      src={getAvatarUrl(seller.avatarUrl)}
      alt={seller.name}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: `2px solid ${selected ? "var(--color-gold-start)" : "rgba(255,255,255,0.08)"}`,
      }}
      onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
    />
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {seller.name}
        </span>
        {seller.isVerifiedIdentity && (
          <CheckCircleFilled style={{ color: "var(--color-gold-start)", fontSize: 12, flexShrink: 0 }} />
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
        {seller.liveAuctions > 0
          ? <span style={{ color: "#4ade80" }}>{seller.liveAuctions} live</span>
          : `${seller.totalAuctions} auctions`}
        {seller.location && <span> · {seller.location}</span>}
      </div>
    </div>
  </div>
);

// ─── Seller info header in right panel ───────────────────────────────────────

const SellerHeader = ({ seller }: { seller: TopSellerPublicResponse }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    background: "var(--color-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--color-border-md)",
    marginBottom: 20,
  }}>
    <img
      src={getAvatarUrl(seller.avatarUrl)}
      alt={seller.name}
      style={{
        width: 56, height: 56, borderRadius: "50%", objectFit: "cover",
        border: "2px solid var(--color-gold-border)", flexShrink: 0,
      }}
      onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
          {seller.name}
        </span>
        {seller.isVerifiedIdentity && (
          <CheckCircleFilled style={{ color: "var(--color-gold-start)", fontSize: 14 }} />
        )}
      </div>
      {seller.location && (
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>{seller.location}</div>
      )}
    </div>
    <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
      {[
        { label: "Total", value: seller.totalAuctions },
        { label: "Live", value: seller.liveAuctions, highlight: seller.liveAuctions > 0 },
        { label: "Sold", value: seller.soldAuctions },
      ].map(({ label, value, highlight }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: highlight ? "#4ade80" : "var(--color-text-primary)",
          }}>{value}</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export const SellersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);

  const [searchValue, setSearchValue] = useState(qParam);
  const [selectedSeller, setSelectedSeller] = useState<TopSellerPublicResponse | null>(null);
  const [auctionPage, setAuctionPage] = useState(pageParam);

  const debouncedSearch = useDebounce(searchValue, 300);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (auctionPage > 1) params.page = String(auctionPage);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, auctionPage, setSearchParams]);

  // Fetch sellers — client-side filter (backend không hỗ trợ q param)
  const { data: allSellers = [], isLoading: sellersLoading } = useQuery({
    queryKey: ["public-sellers"],
    queryFn: () => userApi.getPublicTopSellers(50),
    staleTime: 5 * 60 * 1000,
  });

  const sellers = debouncedSearch
    ? allSellers.filter((s: TopSellerPublicResponse) =>
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : allSellers;

  // Auto-select first seller when list changes
  useEffect(() => {
    if (sellers.length > 0 && !selectedSeller) {
      setSelectedSeller(sellers[0]);
    } else if (sellers.length > 0 && selectedSeller) {
      const stillExists = sellers.find((s: TopSellerPublicResponse) => s.id === selectedSeller.id);
      if (!stillExists) setSelectedSeller(sellers[0]);
    } else if (sellers.length === 0) {
      setSelectedSeller(null);
    }
  }, [sellers]);

  // Fetch auctions for selected seller
  const { data: auctionData, isLoading: auctionsLoading } = useQuery({
    queryKey: ["seller-auctions", selectedSeller?.id, auctionPage],
    queryFn: () => auctionApi.getAuctionsBySeller(selectedSeller!.id, auctionPage, 20),
    enabled: !!selectedSeller,
    staleTime: 60 * 1000,
  });

  const handleSelectSeller = useCallback((seller: TopSellerPublicResponse) => {
    setSelectedSeller(seller);
    setAuctionPage(1);
  }, []);

  const handleCountdownComplete = useCallback(() => {}, []);

  const displayedSellers = sellers.slice(0, 5);

  return (
    <div className="page-outer-padded" style={{ background: "var(--color-bg)", minHeight: "100vh", padding: "40px 0" }}>
      <div className="page-container-padded mx-auto" style={{ maxWidth: "1280px" }}>

        {/* Page header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            className="page-header-row"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}
          >
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                Sellers
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
                Browse and discover auctions by seller
              </p>
            </div>
          </div>
        </div>

        <Row gutter={[20, 20]}>
          {/* ── Left panel: search + seller list ── */}
          <Col xs={24} lg={7}>
            <div style={{ position: "sticky", top: 84 }}>

              {/* Search */}
              <Input
                prefix={<SearchOutlined style={{ color: "var(--color-text-muted)" }} />}
                placeholder="Search sellers..."
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setAuctionPage(1); }}
                allowClear
                style={{ marginBottom: 16, height: 40 }}
              />

              {/* Seller list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sellersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--color-surface)", borderRadius: "var(--radius-md)" }}>
                      <Skeleton.Avatar active size={44} />
                      <div style={{ flex: 1 }}>
                        <Skeleton.Input active size="small" style={{ width: "70%", marginBottom: 6 }} />
                        <Skeleton.Input active size="small" style={{ width: "50%" }} />
                      </div>
                    </div>
                  ))
                ) : displayedSellers.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center" }}>
                    <Empty description={<span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No sellers found</span>} />
                  </div>
                ) : (
                  displayedSellers.map((seller: TopSellerPublicResponse) => (
                    <SellerCard
                      key={seller.id}
                      seller={seller}
                      selected={selectedSeller?.id === seller.id}
                      onClick={() => handleSelectSeller(seller)}
                    />
                  ))
                )}
              </div>
            </div>
          </Col>

          {/* ── Right panel: auctions ── */}
          <Col xs={24} lg={17}>
            {selectedSeller ? (
              <>
                <SellerHeader seller={selectedSeller} />

                {auctionsLoading ? (
                  <div className="auctions-grid-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} style={{
                        background: "var(--color-card)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 16,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: "100%",
                          aspectRatio: "3/2",
                          background: "rgba(255,255,255,0.06)",
                        }} className="ant-skeleton-active" />
                        <div style={{ padding: "14px 16px 16px" }}>
                          <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !auctionData?.data?.length ? (
                  <div style={{ padding: "60px 0", textAlign: "center" }}>
                    <ShopOutlined style={{ fontSize: 48, color: "var(--color-text-muted)", marginBottom: 16 }} />
                    <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>This seller has no auctions yet</p>
                  </div>
                ) : (
                  <>
                    <div className="auctions-grid-4" style={{ marginBottom: 24 }}>
                      {auctionData.data.map((auction: Auction) => (
                        <AuctionCard
                          key={auction.id}
                          auction={auction}
                          onCountdownComplete={handleCountdownComplete}
                        />
                      ))}
                    </div>

                    {auctionData.totalElements > 20 && (
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <Pagination
                          current={auctionPage}
                          total={auctionData.totalElements}
                          pageSize={20}
                          onChange={(p) => { setAuctionPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          showSizeChanger={false}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              !sellersLoading && (
                <div style={{ padding: "80px 0", textAlign: "center" }}>
                  <Empty description={<span style={{ color: "var(--color-text-muted)" }}>Select a seller to view their auctions</span>} />
                </div>
              )
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SellersPage;

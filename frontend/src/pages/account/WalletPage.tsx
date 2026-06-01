import { ArrowRightOutlined, WalletOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Empty, Skeleton, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { depositApi } from "../../api/depositApi";
import { DepositStatus } from "../../api/types";
import { formatCurrency } from "../../utils/format";

const { Title, Text } = Typography;

const STATUS_CONFIG = {
  [DepositStatus.LOCKED]: {
    label: "Active",
    color: "#fed469",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.28)",
  },
  [DepositStatus.RELEASED]: {
    label: "Refunded",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.28)",
  },
  [DepositStatus.APPLIED]: {
    label: "Applied to Payment",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.28)",
  },
  [DepositStatus.FORFEITED]: {
    label: "Forfeited",
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.28)",
  },
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const WalletPage = () => {
  const navigate = useNavigate();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["my-wallet"],
    queryFn: () => depositApi.getMyWallet(),
    staleTime: 30_000,
  });

  const { data: deposits = [], isLoading: depositsLoading } = useQuery({
    queryKey: ["my-deposits"],
    queryFn: () => depositApi.getMyDeposits(),
    staleTime: 30_000,
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <Title
          level={2}
          style={{ color: "#fff", marginBottom: "24px", fontSize: "24px" }}
        >
          Wallet
        </Title>
      </div>

      {/* ── Balance card ─────────────────────────────── */}
      {walletLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 24 }} />
      ) : (
        <div
          style={{
            background: "var(--color-card-high)",
            border: "1px solid var(--color-border-md)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <WalletOutlined style={{ color: "#FED469", fontSize: "17px" }} />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>
              Balance
            </span>
          </div>

          {/* 3-col balance stats — stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Available */}
            <div
              style={{
                background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
              }}
            >
              <div className="info-label" style={{ marginBottom: "6px" }}>
                Available
              </div>
              <div
                style={{ fontSize: "22px", fontWeight: 800, color: "#4ade80" }}
              >
                {formatCurrency(wallet?.availableBalance ?? 0)}
              </div>
            </div>

            {/* Locked */}
            <div
              style={{
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  marginBottom: "6px",
                }}
              >
                <span className="info-label">Locked in Deposits</span>
              </div>
              <div
                style={{ fontSize: "22px", fontWeight: 800, color: "#fed469" }}
              >
                {formatCurrency(wallet?.lockedBalance ?? 0)}
              </div>
            </div>

            {/* Total */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--color-border-md)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
              }}
            >
              <div className="info-label" style={{ marginBottom: "6px" }}>
                Total
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>
                {formatCurrency(wallet?.totalBalance ?? 0)}
              </div>
            </div>
          </div>

          {/* Top Up — coming soon */}
          <div style={{ marginTop: "20px" }}>
            <button
              disabled
              style={{
                padding: "7px 18px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "var(--radius-sm)",
                color: "rgba(255,255,255,0.25)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Top Up — Coming Soon
            </button>
          </div>
        </div>
      )}

      {/* ── Deposit history ───────────────────────────── */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <Title
            level={5}
            style={{ color: "#fff", margin: 0, fontWeight: 700 }}
          >
            Deposit History
          </Title>
          {!depositsLoading && deposits.length > 0 && (
            <span
              style={{
                color: "var(--color-text-muted)",
                fontSize: "13px",
              }}
            >
              ({deposits.length})
            </span>
          )}
        </div>

        {depositsLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : deposits.length === 0 ? (
          <div
            style={{
              background: "var(--color-card-high)",
              border: "1px solid var(--color-border-md)",
              borderRadius: "var(--radius-md)",
              padding: "48px 24px",
            }}
          >
            <Empty
              description={
                <span style={{ color: "var(--color-text-muted)" }}>
                  No deposits yet
                </span>
              }
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {deposits.map((deposit, idx) => {
              const cfg = deposit.status ? STATUS_CONFIG[deposit.status] : null;
              const createdStr = fmtDate(deposit.createdAt);
              const releasedStr = fmtDate(deposit.releasedAt);

              return (
                <div
                  key={`${deposit.auctionId}-${idx}`}
                  style={{
                    background: "var(--color-card-high)",
                    border: "1px solid var(--color-border-md)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    transition: "var(--transition)",
                  }}
                  className="hover:border-[rgba(255,255,255,0.15)]"
                >
                  {/* Left — status badge + auction link + date */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      {cfg && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                            flexShrink: 0,
                          }}
                        >
                          {cfg.label}
                        </span>
                      )}
                      <span
                        onClick={() =>
                          navigate(`/auction/${deposit.auctionId}`)
                        }
                        style={{
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "color 0.15s",
                        }}
                        className="hover:text-[#FED469]"
                      >
                        {deposit.auctionTitle ?? `Auction #${deposit.auctionId}`}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {createdStr && <>Deposited {createdStr}</>}
                      {releasedStr && (
                        <>
                          {" · "}
                          {deposit.status === DepositStatus.RELEASED
                            ? "Refunded"
                            : deposit.status === DepositStatus.APPLIED
                              ? "Applied"
                              : "Settled"}{" "}
                          {releasedStr}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right — amount + view button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: cfg?.color ?? "#fff",
                        textAlign: "right",
                      }}
                    >
                      {deposit.depositAmount != null
                        ? formatCurrency(deposit.depositAmount)
                        : "—"}
                    </div>

                    <button
                      onClick={() => navigate(`/auction/${deposit.auctionId}`)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 12px",
                        background: "transparent",
                        border: "1px solid var(--color-border-md)",
                        borderRadius: "var(--radius-sm)",
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "var(--transition)",
                        whiteSpace: "nowrap",
                      }}
                      className="hover:border-[rgba(255,255,255,0.25)] hover:text-white"
                    >
                      View <ArrowRightOutlined style={{ fontSize: "10px" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;

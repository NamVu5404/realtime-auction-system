import { ArrowRightOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DatePicker,
  Empty,
  InputNumber,
  message,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Tabs,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { depositApi } from "../../api/depositApi";
import { paymentApi } from "../../api/paymentApi";
import { CheckoutFormResponse, DepositStatus, TopUpHistoryItem, TopUpOrderStatus } from "../../api/types";
import { formatCurrency } from "../../utils/format";

const TOPUP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  COMPLETED: { label: "Completed", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.28)" },
  FAILED:    { label: "Failed",    color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.28)" },
  CANCELLED: { label: "Cancelled", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)" },
  EXPIRED:   { label: "Expired",   color: "rgba(255,255,255,0.25)", bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)" },
  PENDING:   { label: "Pending",   color: "#fed469", bg: "rgba(254,212,105,0.08)", border: "rgba(254,212,105,0.28)" },
};

const { Title } = Typography;

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
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

// POST form to SePay — exactly 12 inputs (11 signed fields + signature) in signed order
function submitSePayForm(data: CheckoutFormResponse) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = data.checkoutUrl;

  const fields: [string, string][] = [
    ["merchant", data.merchant],
    ["operation", data.operation],
    ["payment_method", data.paymentMethod],
    ["order_amount", data.orderAmount],
    ["currency", data.currency],
    ["order_invoice_number", data.orderInvoiceNumber],
    ["order_description", data.orderDescription],
    ["customer_id", data.customerId],
    ["success_url", data.successUrl],
    ["error_url", data.errorUrl],
    ["cancel_url", data.cancelUrl],
    ["signature", data.signature],
  ];

  fields.forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

const WalletPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get("tab") ?? "deposits";

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Top-up history filters
  const [historyStatus, setHistoryStatus] = useState<TopUpOrderStatus | undefined>(undefined);
  const [historyDateRange, setHistoryDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: topUpHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["top-up-history", { historyStatus, historyDateRange, historyPage }],
    queryFn: () => paymentApi.getTopUpHistory({
      status: historyStatus,
      from: historyDateRange?.[0]?.startOf("day").valueOf(),
      to: historyDateRange?.[1]?.endOf("day").valueOf(),
      page: historyPage - 1,
      size: 10,
    }),
    staleTime: 30_000,
  });

  // Handle SePay redirect callbacks
  useEffect(() => {
    const status = searchParams.get("topup");
    if (!status) return;
    if (status === "success") {
      message.success("Top-up successful! Your balance has been updated.");
      queryClient.invalidateQueries({ queryKey: ["my-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-header"] });
      queryClient.invalidateQueries({ queryKey: ["top-up-history"] });
    } else if (status === "error") {
      message.error("Top-up failed. Please try again.");
    } else if (status === "cancelled") {
      message.warning("Top-up cancelled.");
    }
    setSearchParams(activeTab !== "deposits" ? { tab: activeTab } : {}, { replace: true });
  }, []);

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

  const checkoutMutation = useMutation({
    mutationFn: (amt: number) => paymentApi.createTopUpOrder(amt),
    onSuccess: (data) => {
      setIsRedirecting(true);
      setTopUpOpen(false);
      submitSePayForm(data);
    },
    onError: (err: Error) => {
      message.error(err.message);
    },
  });

  const handleProceedToCheckout = () => {
    if (!amount || amount < 10000) {
      message.error("Minimum top-up amount is 10,000 VND");
      return;
    }
    if (amount > 500_000_000) {
      message.error("Maximum top-up amount is 500,000,000 VND");
      return;
    }
    checkoutMutation.mutate(amount);
  };

  return (
    <div>
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
            marginBottom: "16px",
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
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>
              Balance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div
              style={{
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
              }}
            >
              <div className="info-label" style={{ marginBottom: "6px" }}>
                Locked in Deposits
              </div>
              <div
                style={{ fontSize: "22px", fontWeight: 800, color: "#fed469" }}
              >
                {formatCurrency(wallet?.lockedBalance ?? 0)}
              </div>
            </div>

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

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => !isRedirecting && setTopUpOpen(true)}
              disabled={isRedirecting}
              style={{
                padding: "7px 18px",
                background: "rgba(254,212,105,0.1)",
                border: "1px solid rgba(254,212,105,0.4)",
                borderRadius: "var(--radius-sm)",
                color: "#FED469",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isRedirecting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isRedirecting ? 0.5 : 1,
              }}
            >
              {isRedirecting ? "Redirecting..." : "Top Up"}
            </button>
          </div>
        </div>
      )}

      {/* ── Top Up Modal ─────────────────────────────── */}
      <Modal
        open={topUpOpen}
        onCancel={() => {
          setTopUpOpen(false);
          setAmount(null);
        }}
        footer={null}
        title={
          <span style={{ color: "#fff", fontWeight: 700 }}>Top Up Wallet</span>
        }
        maskClosable
      >
        <div style={{ paddingTop: "12px" }}>
          <div
            style={{
              color: "var(--color-text-muted)",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            Enter amount and you will be redirected to SePay's secure checkout
            page.
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "13px",
                marginBottom: "6px",
              }}
            >
              Amount (1 VND {"->"} 1 USD)
            </div>
            <InputNumber
              value={amount}
              onChange={(val) => setAmount(val)}
              min={10000}
              max={500_000_000}
              step={10000}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) =>
                Number(v?.replace(/,/g, "") ?? 0) as unknown as 10000
              }
              style={{ width: "100%" }}
              placeholder="10,000 – 500,000,000 VND"
            />
          </div>
          <button
            onClick={handleProceedToCheckout}
            disabled={checkoutMutation.isPending || isRedirecting}
            style={{
              width: "100%",
              padding: "9px 0",
              background: "rgba(254,212,105,0.15)",
              border: "1px solid rgba(254,212,105,0.5)",
              borderRadius: "var(--radius-sm)",
              color: "#FED469",
              fontSize: "14px",
              fontWeight: 700,
              cursor: (checkoutMutation.isPending || isRedirecting) ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {(checkoutMutation.isPending || isRedirecting) ? "Redirecting..." : "Proceed to Checkout"}
          </button>
        </div>
      </Modal>

      {/* ── History tabs ─────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        style={{ color: "#fff" }}
        items={[
          {
            key: "deposits",
            label: (
              <span>
                Deposit History
                {!depositsLoading && deposits.length > 0 && (
                  <span style={{ color: "var(--color-text-muted)", fontSize: "12px", marginLeft: "6px" }}>
                    ({deposits.length})
                  </span>
                )}
              </span>
            ),
            children: (
              <div>
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
            ),
          },
          {
            key: "topup",
            label: "Top-up History",
            children: (
              <div>
                {/* Filter bar */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <Select
                    allowClear
                    placeholder="All statuses"
                    style={{ width: 160 }}
                    value={historyStatus}
                    onChange={(val) => { setHistoryStatus(val); setHistoryPage(1); }}
                    options={[
                      { value: "COMPLETED", label: "Completed" },
                      { value: "FAILED",    label: "Failed" },
                      { value: "CANCELLED", label: "Cancelled" },
                      { value: "EXPIRED",   label: "Expired" },
                    ]}
                  />
                  <DatePicker.RangePicker
                    value={historyDateRange}
                    onChange={(range) => { setHistoryDateRange(range as [Dayjs, Dayjs] | null); setHistoryPage(1); }}
                    style={{ flex: 1, minWidth: 220 }}
                    disabledDate={(d) => d.isAfter(dayjs())}
                  />
                </div>

                {/* List */}
                {historyLoading ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : !topUpHistory || topUpHistory.content.length === 0 ? (
                  <div style={{ background: "var(--color-card-high)", border: "1px solid var(--color-border-md)", borderRadius: "var(--radius-md)", padding: "48px 24px" }}>
                    <Empty description={<span style={{ color: "var(--color-text-muted)" }}>No top-up history</span>} />
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {topUpHistory.content.map((item: TopUpHistoryItem) => {
                        const cfg = TOPUP_STATUS_CONFIG[item.status];
                        return (
                          <div
                            key={item.id}
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
                            }}
                            className="hover:border-[rgba(255,255,255,0.15)]"
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <span style={{
                                  display: "inline-flex", alignItems: "center",
                                  padding: "2px 8px", borderRadius: "100px",
                                  fontSize: "11px", fontWeight: 700,
                                  background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                                  flexShrink: 0,
                                }}>
                                  {cfg.label}
                                </span>
                                <span style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>
                                  {formatCurrency(item.amount)}
                                </span>
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                                {fmtDate(item.createdAt)}
                                <span style={{ marginLeft: "8px", fontFamily: "monospace", fontSize: "11px" }}>
                                  {item.invoiceNumber}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                      <Pagination
                        current={historyPage}
                        pageSize={10}
                        total={topUpHistory.totalElements}
                        onChange={(p) => setHistoryPage(p)}
                        showSizeChanger={false}
                        showTotal={(total) => `${total} records`}
                      />
                    </div>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default WalletPage;

import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, notification, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bidApi from "../api/bidApi";
import {
  AuctionStatus,
  BidStatus,
  MyBidHistoryResponse,
  PageResponse,
} from "../api/types";
import { formatCurrency, formatDateTime } from "../utils/format";

const PAGE_SIZE = 20;

const MyBidsPage = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery<
    PageResponse<MyBidHistoryResponse>,
    Error
  >({
    queryKey: ["my-bids", page],
    queryFn: () => bidApi.getMyBidHistory(page, PAGE_SIZE),
    staleTime: 30000,
  });

  useEffect(() => {
    if (isError) {
      notification.error({
        message: "Failed to load bid history",
        description: (error as any)?.message || "Please try again later.",
      });
    }
  }, [isError, error]);

  if (!isLoading && data && data.data.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-bg)",
          minHeight: "100vh",
          padding: "48px 0",
        }}
      >
        <div className="container max-w-7xl mx-auto px-6">
          <Empty
            description={
              <span style={{ color: "rgba(255,255,255,0.4)" }}>
                No bids found
              </span>
            }
          >
            <Button
              type="primary"
              onClick={() => navigate("/")}
              style={{ marginTop: "12px" }}
            >
              Browse Auctions
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: "Item",
      dataIndex: "auctionTitle",
      key: "auctionTitle",
      render: (text: string, record: MyBidHistoryResponse) => (
        <a
          onClick={() => navigate(`/auction/${record.auctionId}`)}
          className="text-white font-semibold cursor-pointer hover:text-[#FED469] transition-colors"
        >
          {text}
        </a>
      ),
    },
    {
      title: "Bid Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt: number) => (
        <span style={{ color: "#fff", fontWeight: 600 }}>
          {formatCurrency(amt)}
        </span>
      ),
    },
    {
      title: "Current Price",
      key: "auctionPrice",
      render: (record: MyBidHistoryResponse) => {
        const isLive = record.auctionStatus === AuctionStatus.LIVE;
        const isEnded = record.auctionStatus === AuctionStatus.ENDED;
        return (
          <div className="flex items-center gap-2">
            <span style={{ color: "#fff" }}>
              {formatCurrency(record.currentPrice)}
            </span>
          </div>
        );
      },
    },
    {
      title: "Bid Status",
      dataIndex: "status",
      key: "bidStatus",
      render: (status: BidStatus) => {
        const colorMap: Record<BidStatus, string> = {
          [BidStatus.ACCEPTED]: "green",
          [BidStatus.REJECTED]: "red",
          [BidStatus.FLAGGED]: "orange",
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dt: string) => (
        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>
          {formatDateTime(dt)}
        </span>
      ),
    },
    {
      title: "Auction Status",
      dataIndex: "auctionStatus",
      key: "auctionStatus",
      render: (status: AuctionStatus) => {
        const colorMap: Partial<Record<AuctionStatus, string>> = {
          [AuctionStatus.LIVE]: "green",
          [AuctionStatus.ENDED]: "default",
        };
        return <Tag color={colorMap[status] ?? "default"}>{status}</Tag>;
      },
    },
  ];

  return (
    <div
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        padding: "48px 0",
      }}
    >
      <div className="container max-w-7xl mx-auto px-6">
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: "32px",
            background:
              "linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.55))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          My Bids
        </h1>

        {/* Table */}
        <div
          style={{
            background: "rgba(20,20,20,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey={(record: MyBidHistoryResponse) =>
              `${record.auctionId}-${record.createdAt}`
            }
            pagination={{
              current: data ? data.currentPage : page,
              pageSize: data ? data.pageSize : PAGE_SIZE,
              total: data ? data.totalElements : 0,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
            }}
            loading={isLoading}
            style={{ background: "transparent" }}
          />
        </div>
      </div>
    </div>
  );
};

export default MyBidsPage;

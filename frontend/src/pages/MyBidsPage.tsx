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
      <div className="bg-black min-h-screen py-8">
        <div className="container max-w-7xl mx-auto px-4">
          <Empty description="No bids found">
            <Button type="primary" onClick={() => navigate("/")}>
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
          className="text-white"
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
        <span className="text-white">{formatCurrency(amt)}</span>
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
            <span className="text-white">
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
        <span className="text-gray-300">{formatDateTime(dt)}</span>
      ),
    },
    {
      title: "Auction Status",
      dataIndex: "auctionStatus",
      key: "auctionStatus",
      render: (status: AuctionStatus) => {
        const colorMap: Partial<Record<AuctionStatus, string>> = {
          [AuctionStatus.LIVE]: "green",
          [AuctionStatus.ENDED]: "white",
        };
        return (
          <span style={{ color: colorMap[status] ?? "#fff" }}>{status}</span>
        );
      },
    },
  ];

  return (
    <div className="bg-black min-h-screen py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-6">My Bids</h1>

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
          className="bg-zinc-900 border-zinc-800"
        />
      </div>
    </div>
  );
};

export default MyBidsPage;

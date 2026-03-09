import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Typography, Button, Empty } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import bidApi from "../../api/bidApi";
import {
  AuctionStatus,
  BidStatus,
  MyBidHistoryResponse,
  PageResponse,
} from "../../api/types";
import { formatCurrency, formatDateTime } from "../../utils/format";
const { Title, Text } = Typography;

const BidsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const navigate = useNavigate();

  const handlePageChange = (p: number) => {
    setSearchParams({ page: p.toString() });
  };

  const { data, isLoading } = useQuery<
    PageResponse<MyBidHistoryResponse>,
    Error
  >({
    queryKey: ["my-bids", page],
    queryFn: () => bidApi.getMyBidHistory(page, 20),
  });

  const columns = [
    {
      title: "Product",
      dataIndex: "auctionTitle",
      key: "auctionTitle",
      render: (text: string, record: MyBidHistoryResponse) => (
        <a
          onClick={() => navigate(`/auction/${record.auctionId}`)}
          style={{
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          className="hover:text-[#fed469]"
        >
          {text}
        </a>
      ),
    },
    {
      title: "My Bid",
      dataIndex: "amount",
      key: "amount",
      render: (amt: number) => (
        <span style={{ color: "#fff", fontWeight: 700 }}>
          {formatCurrency(amt)}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (record: MyBidHistoryResponse) => {
        const isLeading = record.currentPrice === record.amount;

        if (record.auctionStatus === AuctionStatus.ENDED && isLeading) {
          return (
            <Tag
              color="#fed469"
              style={{ color: "#fed469", fontWeight: 600, border: "none" }}
            >
              Winner 🏆
            </Tag>
          );
        }

        return isLeading ? (
          <Tag color="success" style={{ border: "none" }}>
            Leading
          </Tag>
        ) : (
          <Tag color="error" style={{ border: "none" }}>
            Outbid
          </Tag>
        );
      },
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dt: string) => (
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>
          {formatDateTime(dt)}
        </Text>
      ),
    },
  ];

  if (!isLoading && data && data.data.length === 0) {
    return (
      <Empty
        description={
          <span style={{ color: "rgba(255,255,255,0.45)" }}>
            You haven't placed any bids yet
          </span>
        }
      >
        <Button
          type="primary"
          onClick={() => navigate("/")}
          style={{ borderRadius: "100px", padding: "0 24px" }}
        >
          Browse Auctions
        </Button>
      </Empty>
    );
  }

  return (
    <div className="account-table-wrapper">
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "32px", fontSize: "24px" }}
      >
        Bid History
      </Title>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey={(record) => `${record.auctionId}-${record.createdAt}`}
        pagination={{
          current: page,
          pageSize: data?.pageSize || 20,
          total: data?.totalElements || 0,
          onChange: handlePageChange,
          showSizeChanger: false,
        }}
        loading={isLoading}
        style={{
          background: "transparent",
        }}
        scroll={{ x: 800 }}
        className="custom-table"
      />
    </div>
  );
};

export default BidsPage;

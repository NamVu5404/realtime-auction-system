import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Segmented,
  Spin,
  Space,
  Progress,
  Result,
} from "antd";
import {
  DollarOutlined,
  FireOutlined,
  TrophyOutlined,
  DotChartOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import {
  ComposedChart,
  Bar,
  Area,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import bidApi from "../../api/bidApi";
import formatCurrency from "../../utils/format";

const { Title, Text } = Typography;

interface BidStatisticsDashboardProps {
  userId?: number;
}

const BidStatisticsDashboard: React.FC<BidStatisticsDashboardProps> = ({
  userId,
}) => {
  const [period, setPeriod] = useState<"WEEK" | "MONTH">("MONTH");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["bid-stats", period, userId],
    queryFn: () =>
      userId
        ? bidApi.getBidStatsAdmin(userId, period)
        : bidApi.getMyBidStats(period),
  });

  if (isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "100px" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <Result
        status="500"
        title="Something went wrong"
        subTitle={error.message}
      />
    );
  }

  const stats = data!;
  const avgBids =
    stats.totalAuctionsParticipated > 0
      ? (stats.totalBids / stats.totalAuctionsParticipated).toFixed(1)
      : "0";

  const winRate =
    stats.totalAuctionsParticipated > 0
      ? Math.round((stats.totalWins / stats.totalAuctionsParticipated) * 100)
      : 0;

  return (
    <div
      className={userId ? "" : "account-table-wrapper"}
      style={{ padding: userId ? "0" : undefined }}
    >
      {!userId && (
        <Title
          level={2}
          style={{ color: "#fff", marginBottom: "24px", fontSize: "24px" }}
        >
          My Bidding Statistics
        </Title>
      )}

      {/* Row 1: Hero KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={24} md={8}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              },
            }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  Total Spent
                </span>
              }
              value={stats.totalSpent}
              precision={0}
              prefix={<DollarOutlined />}
              styles={{ content: { color: "#fff", fontWeight: "bold" } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              },
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Auctions Won
                  </span>
                }
                value={stats.totalWins}
                prefix={<TrophyOutlined />}
                suffix={`/ ${stats.totalAuctionsParticipated}`}
                styles={{ content: { color: "#fff", fontWeight: "bold" } }}
              />
              <Progress
                type="circle"
                percent={winRate}
                size={50}
                strokeColor="#60a5fa"
                trailColor="rgba(255,255,255,0.2)"
                format={(p) => (
                  <span style={{ color: "#fff", fontSize: "12px" }}>{p}%</span>
                )}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
              },
            }}
          >
            <Statistic
              title={
                <Space>
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Active Leading
                  </span>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      background: "#fba919",
                      borderRadius: "50%",
                      animation: "pulse 2s infinite",
                    }}
                  />
                </Space>
              }
              value={stats.activeLeading}
              prefix={<FireOutlined />}
              styles={{ content: { color: "#fff", fontWeight: "bold" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Header for Quick Stats */}
      <Title level={4} style={{ marginBottom: "16px" }}>
        Quick Stats
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Bids"
              value={stats.totalBids}
              prefix={<DotChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Participated"
              value={stats.totalAuctionsParticipated}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Avg Bids/Auction" value={avgBids} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Highest Won"
              value={formatCurrency(stats.highestWinningBid)}
              styles={{ content: { color: "var(--color-gold-start)" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 3: The Chart */}
      <Card
        title="Bidding Activity"
        extra={
          <Segmented
            options={["WEEK", "MONTH"]}
            value={period}
            onChange={(value) => setPeriod(value as "WEEK" | "MONTH")}
          />
        }
      >
        {stats.activityChart && stats.activityChart.length > 0 ? (
          <div style={{ width: "100%", height: "380px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.activityChart} margin={{ top: 30 }}>
                <defs>
                  <linearGradient
                    id="colorAuctions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.1}
                  stroke="#fff"
                />
                <XAxis
                  dataKey="periodLabel"
                  tick={{ fill: "rgba(255,255,255,0.45)" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "rgba(255,255,255,0.45)" }}
                  label={{
                    value: "Bids",
                    position: "top",
                    fill: "rgba(255,255,255,0.45)",
                    offset: 15,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "rgba(255,255,255,0.45)" }}
                  label={{
                    value: "Auctions",
                    position: "top",
                    fill: "rgba(255,255,255,0.45)",
                    offset: 15,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#262626",
                    border: "1px solid #434343",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar
                  yAxisId="right"
                  dataKey="auctionsParticipated"
                  name="Auctions Participated"
                  fill="url(#colorAuctions)"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="bidCount"
                  name="Total Bids"
                  fill="url(#colorBids)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text type="secondary">
              No bidding activity found for the selected period.
            </Text>
          </div>
        )}
      </Card>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(251, 169, 25, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(251, 169, 25, 0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 169, 25, 0); }
        }
      `}</style>
    </div>
  );
};

export default BidStatisticsDashboard;

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
  FireOutlined,
  TrophyOutlined,
  DotChartOutlined,
  ShoppingOutlined,
  UsergroupAddOutlined,
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
import { auctionApi } from "../../api/auctionApi";
import formatCurrency from "../../utils/format";

const { Title, Text } = Typography;

interface SellerStatisticsDashboardProps {
  sellerId?: number;
}

const SellerStatisticsDashboard: React.FC<SellerStatisticsDashboardProps> = ({
  sellerId,
}) => {
  const [period, setPeriod] = useState<"WEEK" | "MONTH">("MONTH");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["seller-stats", period, sellerId],
    queryFn: () =>
      sellerId
        ? auctionApi.getSellerStatsAdmin(sellerId, period)
        : auctionApi.getMySellerStats(period),
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
        subTitle={error?.message || "Failed to load seller statistics"}
      />
    );
  }

  const stats = data!;

  const successRate =
    stats.totalAuctionsEnded > 0
      ? Math.round((stats.totalAuctionsSold / stats.totalAuctionsEnded) * 100)
      : 0;

  const avgSellingPrice =
    stats.totalAuctionsSold > 0
      ? stats.totalRevenue / stats.totalAuctionsSold
      : 0;

  const avgBidsPerAuction =
    stats.totalAuctionsEnded > 0
      ? (stats.totalBidsReceived / stats.totalAuctionsEnded).toFixed(1)
      : "0";

  return (
    <div>
      {!sellerId && (
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "24px",
          }}
        >
          Seller Dashboard
        </h1>
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
                  Total Revenue
                </span>
              }
              value={formatCurrency(stats.totalRevenue)}
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
                    Success Rate
                  </span>
                }
                value={stats.totalAuctionsSold}
                prefix={<TrophyOutlined />}
                suffix={`/ ${stats.totalAuctionsEnded}`}
                styles={{ content: { color: "#fff", fontWeight: "bold" } }}
              />
              <Progress
                type="circle"
                percent={successRate}
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
                    Active & Upcoming
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
              value={stats.activeAuctions}
              prefix={<FireOutlined />}
              styles={{ content: { color: "#fff", fontWeight: "bold" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Quick Stats */}
      <Title level={4} style={{ marginBottom: "16px" }}>
        Quick Stats
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }} align="stretch">
        <Col xs={12} sm={8} md={8} style={{ display: "flex" }}>
          <Card size="small" style={{ flex: 1 }}>
            <Statistic
              title="Total Bids Received"
              value={stats.totalBidsReceived}
              prefix={<DotChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} style={{ display: "flex" }}>
          <Card size="small" style={{ flex: 1 }}>
            <Statistic
              title="Unique Bidders"
              value={stats.totalUniqueBidders}
              prefix={<UsergroupAddOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} style={{ display: "flex" }}>
          <Card size="small" style={{ flex: 1 }}>
            <Statistic
              title="Avg Selling Price"
              value={formatCurrency(avgSellingPrice)}
              styles={{ content: { fontSize: "24px" } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} style={{ display: "flex" }}>
          <Card size="small" style={{ flex: 1 }}>
            <Statistic title="Avg Bids/Auction" value={avgBidsPerAuction} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} style={{ display: "flex" }}>
          <Card size="small" style={{ flex: 1 }}>
            <Statistic
              title="Total Created"
              value={stats.totalAuctionsCreated}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8} style={{ display: "flex" }}>
          <Card size="small" style={{ flex: 1 }}>
            <Statistic
              title="Highest Sold Item"
              value={formatCurrency(stats.highestSoldPrice)}
              styles={{
                content: { color: "var(--color-gold-start)", fontSize: "24px" },
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 3: Revenue Chart */}
      <Card
        title="Revenue & Activity"
        extra={
          <Segmented
            options={["WEEK", "MONTH"]}
            value={period}
            onChange={(value) => setPeriod(value as "WEEK" | "MONTH")}
          />
        }
      >
        {stats.revenueChart && stats.revenueChart.length > 0 ? (
          <div style={{ width: "100%", height: "380px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.revenueChart} margin={{ top: 30 }}>
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
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                    value: "Auctions",
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
                    value: "Revenue",
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
                  yAxisId="left"
                  dataKey="auctionsCompleted"
                  name="Auctions Completed"
                  fill="url(#colorAuctions)"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue ($)"
                  fill="url(#colorRevenue)"
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
              No revenue activity found for the selected period.
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

export default SellerStatisticsDashboard;

import {
  LineChartOutlined,
  MailOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQueries } from "@tanstack/react-query";
import {
  Card,
  Col,
  Progress,
  Result,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Typography,
  Table,
  Avatar,
} from "antd";
import React, { useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsApi } from "../../api/analyticsApi";
import formatCurrency from "../../utils/format";
import { getAvatarUrl } from "../../utils/imageUtils";

const { Title, Text } = Typography;

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#fba919",
  "#ef4444",
  "#8b5cf6",
  "#6b7280",
];

const AdminDashboardContent: React.FC = () => {
  const [period, setPeriod] = useState<"WEEK" | "MONTH">("MONTH");

  const results = useQueries({
    queries: [
      {
        queryKey: ["admin-kpis"],
        queryFn: analyticsApi.getAdminKpis,
      },
      {
        queryKey: ["admin-auction-overview"],
        queryFn: analyticsApi.getAdminAuctionOverview,
      },
      {
        queryKey: ["admin-user-analytics"],
        queryFn: analyticsApi.getAdminUserAnalytics,
      },
      {
        queryKey: ["admin-revenue-chart", period],
        queryFn: () => analyticsApi.getAdminRevenueChart(period),
      },
      {
        queryKey: ["admin-top-performers"],
        queryFn: analyticsApi.getTopPerformers,
      },
    ],
  });

  const [kpiRes, overviewRes, userRes, chartRes, topRes] = results;

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  if (isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "100px" }}
      >
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  if (isError) {
    const errorMsg =
      results.find((r) => r.isError)?.error?.message ||
      "Failed to load dashboard data";
    return (
      <Result status="500" title="Something went wrong" subTitle={errorMsg} />
    );
  }

  const kpis = kpiRes.data!;
  const overview = overviewRes.data!;
  const userStats = userRes.data!;
  const chartData = chartRes.data!;
  const topPerformers = topRes.data!;

  const auctionPieData = [
    { name: "Live", value: overview.liveCount },
    { name: "Scheduled", value: overview.scheduledCount },
    { name: "Ended", value: overview.endedCount },
    { name: "Ended No Sale", value: overview.endedNoSaleCount },
    { name: "Cancelled", value: overview.cancelledCount },
    { name: "Draft", value: overview.draftCount },
  ].filter((d) => d.value > 0);

  return (
    <div>
      {/* Block 1: Hero KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }} align="stretch">
        <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                padding: "16px",
              },
            }}
            style={{ flex: 1 }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Revenue</span>
              }
              value={formatCurrency(kpis.totalPlatformRevenue)}
              styles={{
                content: {
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "24px",
                },
              }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                padding: "16px",
              },
            }}
            style={{ flex: 1 }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  Live Auctions
                </span>
              }
              value={kpis.liveAuctions}
              styles={{
                content: {
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "24px",
                },
              }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)",
                padding: "16px",
              },
            }}
            style={{ flex: 1 }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  Total Users
                </span>
              }
              value={kpis.totalUsers}
              styles={{
                content: {
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "24px",
                },
              }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
                padding: "16px",
              },
            }}
            style={{ flex: 1 }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Sellers</span>
              }
              value={kpis.totalSellers}
              styles={{
                content: {
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "24px",
                },
              }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
                padding: "16px",
              },
            }}
            style={{ flex: 1 }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  Seller Requests
                </span>
              }
              value={kpis.pendingSellerRequests}
              styles={{
                content: {
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "24px",
                },
              }}
              prefix={<SolutionOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} style={{ display: "flex" }}>
          <Card
            styles={{
              body: {
                background: "linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)",
                padding: "16px",
              },
            }}
            style={{ flex: 1 }}
          >
            <Statistic
              title={
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Contacts</span>
              }
              value={kpis.pendingContacts}
              styles={{
                content: {
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "24px",
                },
              }}
              prefix={<MailOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Block 2: Auction Overview */}
        <Col xs={24} lg={12}>
          <Card title="Auction Status Breakdown" style={{ height: "100%" }}>
            <Row align="middle">
              <Col xs={24} sm={12}>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={auctionPieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {auctionPieData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#262626",
                          border: "1px solid #434343",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <Space
                  orientation="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  <Card size="small">
                    <div style={{ display: "flex", gap: 32 }}>
                      <Statistic
                        title="Total Auctions"
                        value={overview.totalAuctions}
                      />
                      <Statistic title="Public" value={overview.publicCount} />
                      <Statistic
                        title="Private"
                        value={overview.privateCount}
                      />
                    </div>
                  </Card>
                  <Card size="small">
                    <Statistic
                      title="Success Rate"
                      value={overview.successRate}
                      suffix="%"
                      decimalSeparator="."
                      precision={1}
                    />
                    <Progress
                      percent={Math.round(overview.successRate)}
                      size="small"
                      strokeColor="#10b981"
                    />
                  </Card>
                  <Card size="small">
                    <Statistic
                      title="Avg Bids/Auction"
                      value={overview.avgBidsPerAuction}
                      precision={1}
                    />
                  </Card>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Block 3: User Analytics & Geo */}
        <Col xs={24} lg={12}>
          <Card title="User Geography & Stats" style={{ height: "100%" }}>
            <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="New this month"
                    value={userStats.newUsersThisMonth}
                    styles={{
                      content: {
                        color: "#10b981",
                      },
                    }}
                    prefix={<UsergroupAddOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Blocked Users"
                    value={userStats.blockedUsers}
                    styles={{
                      content: {
                        color: "#ef4444",
                      },
                    }}
                    prefix={<SafetyCertificateOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Title level={5}>Top Countries</Title>
            <div style={{ width: "100%", height: "220px" }}>
              <ResponsiveContainer>
                <BarChart
                  data={userStats.usersByCountry}
                  layout="vertical"
                  margin={{ left: 40, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="country"
                    type="category"
                    tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      background: "#262626",
                      border: "1px solid #434343",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar
                    dataKey="userCount"
                    name="Users"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Block 4: Revenue & Activity Chart */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                <span>Platform Activity & Revenue</span>
              </Space>
            }
            extra={
              <Segmented
                options={["WEEK", "MONTH"]}
                value={period}
                onChange={(v) => setPeriod(v as any)}
              />
            }
          >
            <Row gutter={24} align="middle">
              <Col xs={48} md={18}>
                <div style={{ width: "100%", height: "380px" }}>
                  <ResponsiveContainer>
                    <ComposedChart
                      data={chartData.chartData}
                      margin={{ top: 30 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorBids"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.1}
                        vertical={false}
                      />
                      <XAxis dataKey="periodLabel" />
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
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="bidCount"
                        name="Bids Placed"
                        fill="url(#colorBids)"
                        barSize={35}
                        radius={[4, 4, 0, 0]}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue ($)"
                        stroke="#3b82f6"
                        fill="url(#colorRevenue)"
                        strokeWidth={3}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <Space
                  orientation="vertical"
                  style={{ width: "100%" }}
                  size="large"
                >
                  <Card
                    size="small"
                    styles={{ body: { borderLeft: "4px solid #3b82f6" } }}
                  >
                    <Statistic
                      title="Period Revenue"
                      value={formatCurrency(chartData.totalRevenue)}
                    />
                  </Card>
                  <Card
                    size="small"
                    styles={{ body: { borderLeft: "4px solid #10b981" } }}
                  >
                    <Statistic
                      title="Period Bids"
                      value={chartData.totalBids}
                    />
                  </Card>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    * Grouped by {period.toLowerCase()}ly granularity. Stats
                    based on completed transactions and bid timestamps.
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Block 5: Top Performers */}
        <Col span={24}>
          <Title level={4} style={{ marginBottom: "16px" }}>
            Top Performers
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card
                title="Top 5 Sellers by Revenue"
                className="account-table-wrapper"
              >
                <Table
                  dataSource={topPerformers.topSellers}
                  pagination={false}
                  rowKey="sellerId"
                  size="small"
                  style={{
                    background: "transparent",
                  }}
                  className="custom-table"
                >
                  <Table.Column
                    title="Seller"
                    key="seller"
                    render={(_, record: any) => (
                      <Space>
                        <Avatar
                          src={
                            record.avatarUrl
                              ? getAvatarUrl(record.avatarUrl)
                              : undefined
                          }
                          icon={<UserOutlined />}
                        />
                        <div>
                          <Text strong>{record.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            {record.email}
                          </Text>
                        </div>
                      </Space>
                    )}
                  />
                  <Table.Column
                    title="Revenue"
                    dataIndex="totalRevenue"
                    key="revenue"
                    render={(val) => (
                      <Text strong style={{ color: "#3b82f6" }}>
                        {formatCurrency(val)}
                      </Text>
                    )}
                  />
                  <Table.Column
                    title="Sold"
                    dataIndex="auctionCount"
                    key="sold"
                  />
                </Table>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title="Most Active Auctions"
                className="account-table-wrapper"
              >
                <Table
                  dataSource={topPerformers.mostActiveAuctions}
                  pagination={false}
                  rowKey="auctionId"
                  size="small"
                  style={{
                    background: "transparent",
                  }}
                  className="custom-table"
                >
                  <Table.Column
                    title="Auction Title"
                    dataIndex="title"
                    key="title"
                    render={(text) => <Text strong>{text}</Text>}
                  />
                  <Table.Column
                    title="Bids"
                    dataIndex="bidCount"
                    key="bids"
                    render={(val) => (
                      <Text style={{ color: "#10b981" }}>{val} bids</Text>
                    )}
                  />
                  <Table.Column
                    title="Price"
                    dataIndex="currentPrice"
                    key="price"
                    render={(val) => formatCurrency(val)}
                  />
                  <Table.Column
                    title="Status"
                    dataIndex="status"
                    key="status"
                    render={(status) => (
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background:
                            status === "LIVE"
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(107, 114, 128, 0.2)",
                          color: status === "LIVE" ? "#10b981" : "#9ca3af",
                        }}
                      >
                        {status}
                      </span>
                    )}
                  />
                </Table>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      <style>{`
        .ant-statistic-title {
          font-size: 14px;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardContent;

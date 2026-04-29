import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Col,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import adminApi from "../../api/adminApi";
import { AiReviewDecision, AiReviewLog } from "../../api/types";

const { Text } = Typography;

const DECISION_CONFIG: Record<
  AiReviewDecision,
  { color: string; icon: React.ReactNode; label: string }
> = {
  [AiReviewDecision.APPROVED]: {
    color: "#10B981",
    icon: <CheckCircleOutlined />,
    label: "Approved",
  },
  [AiReviewDecision.REJECTED]: {
    color: "#F43F5E",
    icon: <CloseCircleOutlined />,
    label: "Rejected",
  },
  [AiReviewDecision.FALLBACK_TO_ADMIN]: {
    color: "#F59E0B",
    icon: <QuestionCircleOutlined />,
    label: "Fallback",
  },
};

const AILogsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [auctionId, setAuctionId] = useState<number | undefined>(undefined);
  const [decision, setDecision] = useState<AiReviewDecision | undefined>(
    undefined,
  );

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", p.toString());
    setSearchParams(params);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["ai-logs", page, auctionId, decision],
    queryFn: () => adminApi.getAiLogs(page, 20, auctionId, decision),
  });

  const { data: counts } = useQuery({
    queryKey: ["ai-logs-counts", auctionId],
    queryFn: () => adminApi.getAiLogCounts(),
  });

  const logs = data?.data ?? [];
  const total = counts?.total ?? 0;
  const approvedCount = counts?.approved ?? 0;
  const rejectedCount = counts?.rejected ?? 0;
  const fallbackCount = counts?.fallbackToAdmin ?? 0;

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 50,
      render: (id: number) => (
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          #{id}
        </Text>
      ),
    },
    {
      title: "Auction",
      key: "auction",
      render: (_: unknown, record: AiReviewLog) => (
        <div>
          <Text style={{ color: "#fff", fontSize: 13 }}>
            {record.auctionTitle ?? `Auction #${record.auctionId}`}
          </Text>
          <br />
          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
            ID: {record.auctionId}
          </Text>
        </div>
      ),
    },
    {
      title: "Decision",
      dataIndex: "decision",
      key: "decision",
      width: 130,
      render: (d: AiReviewDecision) => {
        const cfg = DECISION_CONFIG[d];
        return (
          <Tag
            icon={cfg.icon}
            style={{
              background: `${cfg.color}18`,
              border: `1px solid ${cfg.color}40`,
              color: cfg.color,
              borderRadius: 6,
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",
      width: 110,
      render: (v?: number) =>
        v != null ? (
          <Text
            style={{
              color: v >= 0.85 ? "#10B981" : v >= 0.7 ? "#F59E0B" : "#F43F5E",
            }}
          >
            {(v * 100).toFixed(0)}%
          </Text>
        ) : (
          <Text style={{ color: "rgba(255,255,255,0.3)" }}>—</Text>
        ),
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 170,
      render: (m?: string) => (
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
          {m ?? "—"}
        </Text>
      ),
    },
    {
      title: "Response (ms)",
      dataIndex: "responseTimeMs",
      key: "responseTimeMs",
      width: 120,
      render: (ms?: number) =>
        ms != null ? (
          <Text
            style={{
              color: ms > 5000 ? "#F43F5E" : "rgba(255,255,255,0.55)",
              fontSize: 12,
            }}
          >
            {ms.toLocaleString()}ms
          </Text>
        ) : (
          <Text style={{ color: "rgba(255,255,255,0.3)" }}>—</Text>
        ),
    },
    {
      title: "Reasons",
      dataIndex: "reasons",
      key: "reasons",
      render: (r?: string) =>
        r ? (
          <Tooltip title={r}>
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 12,
                maxWidth: 200,
                display: "inline-block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r}
            </Text>
          </Tooltip>
        ) : (
          <Text style={{ color: "rgba(255,255,255,0.3)" }}>—</Text>
        ),
    },
    {
      title: "Error",
      dataIndex: "errorMessage",
      key: "errorMessage",
      render: (e?: string) =>
        e ? (
          <Tooltip title={e}>
            <Text style={{ color: "#F43F5E", fontSize: 12, cursor: "help" }}>
              ⚠ Error
            </Text>
          </Tooltip>
        ) : null,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (t: string) => (
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
          {dayjs(t).format("DD/MM/YYYY HH:mm")}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: "24px",
        }}
      >
        AI Review Logs
      </h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { label: "Total", value: total, color: "#FED469" },
          { label: "Approved", value: approvedCount, color: "#10B981" },
          { label: "Rejected", value: rejectedCount, color: "#F43F5E" },
          { label: "Fallback", value: fallbackCount, color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <Col span={6} key={label}>
            <Card
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
              }}
            >
              <Statistic
                title={
                  <span
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}
                  >
                    {label}
                  </span>
                }
                value={value}
                valueStyle={{ color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <Space wrap>
          <Select
            placeholder="Filter by decision"
            allowClear
            style={{ width: 180 }}
            value={decision}
            onChange={(v) => {
              setDecision(v);
              setPage(1);
            }}
            options={[
              { value: AiReviewDecision.APPROVED, label: "Approved" },
              { value: AiReviewDecision.REJECTED, label: "Rejected" },
              {
                value: AiReviewDecision.FALLBACK_TO_ADMIN,
                label: "Fallback to Admin",
              },
            ]}
          />
          <InputNumber
            placeholder="Auction ID"
            min={1}
            value={auctionId}
            style={{ width: 140 }}
            onChange={(v) => {
              setAuctionId(v ?? undefined);
              setPage(1);
            }}
          />
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={logs}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.totalElements ?? 0,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} items`,
        }}
        rowClassName={() => "ai-log-row"}
      />
    </div>
  );
};

export default AILogsPage;

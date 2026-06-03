import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, DatePicker, Input, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import adminApi from "../../api/adminApi";
import { AdminTopUpHistoryItem, TopUpOrderStatus } from "../../api/types";
import { useDebounce } from "../../hooks/useDebounce";
import { formatDateTime } from "../../utils/format";
import { formatCurrency } from "../../utils/format";

dayjs.extend(utc);

const STATUS_COLOR: Record<TopUpOrderStatus, string> = {
  COMPLETED: "green",
  FAILED: "red",
  CANCELLED: "default",
  EXPIRED: "warning",
  PENDING: "gold",
};

const STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED",    label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED",   label: "Expired" },
];

export const AdminTopUpHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");

  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<TopUpOrderStatus | undefined>(
    (searchParams.get("status") as TopUpOrderStatus) || undefined
  );
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 300);

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  const activeFilterCount = [status, dateRange?.[0]].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-topup-history", page, debouncedKeyword, status, dateRange],
    queryFn: () => adminApi.getTopUpHistory({
      keyword: debouncedKeyword || undefined,
      status,
      from: dateRange?.[0]?.startOf("day").valueOf(),
      to:   dateRange?.[1]?.endOf("day").valueOf(),
      page: page - 1,
      size: 20,
    }),
  });

  const columns: ColumnsType<AdminTopUpHistoryItem> = [
    {
      title: "#",
      dataIndex: "id",
      width: 70,
    },
    {
      title: "User",
      dataIndex: "userEmail",
      render: (email: string, row) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{email}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>ID: {row.userId}</div>
        </div>
      ),
    },
    {
      title: "Invoice",
      dataIndex: "invoiceNumber",
      render: (v: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 130,
      render: (v: number) => (
        <span style={{ fontWeight: 700 }}>{formatCurrency(v)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (s: TopUpOrderStatus) => (
        <Tag color={STATUS_COLOR[s]}>{s}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      width: 150,
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          Top-up History
        </h1>
        <Badge count={activeFilterCount} size="small">
          <Button
            icon={<FilterOutlined />}
            onClick={() => setIsFilterOpen((v) => !v)}
          >
            Filters
          </Button>
        </Badge>
      </div>

      {/* Search bar (always visible) */}
      <div style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by email or invoice..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          allowClear
          style={{ maxWidth: 420 }}
        />
      </div>

      {/* Collapsible filters */}
      {isFilterOpen && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
            marginBottom: 16,
            padding: "14px 16px",
            background: "var(--color-card-high)",
            border: "1px solid var(--color-border-md)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Select
            allowClear
            placeholder="All statuses"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={STATUS_OPTIONS}
            style={{ width: "100%" }}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(r) => { setDateRange(r as [dayjs.Dayjs, dayjs.Dayjs] | null); setPage(1); }}
            disabledDate={(d) => d.isAfter(dayjs())}
            style={{ width: "100%" }}
          />
          <Button
            onClick={() => {
              setKeyword("");
              setStatus(undefined);
              setDateRange(null);
              setPage(1);
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      <Table
        rowKey="id"
        dataSource={data?.content ?? []}
        columns={columns}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.totalElements ?? 0,
          onChange: setPage,
          showTotal: (total) => `${total} records`,
          showSizeChanger: false,
        }}
        scroll={{ x: 800 }}
      />
    </div>
  );
};

export default AdminTopUpHistoryPage;

import {
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  MoreOutlined,
  SearchOutlined,
  StopOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Drawer,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import adminApi, { mockViolations } from "../../api/adminApi";
import bidApi from "../../api/bidApi";
import {
  AuctionStatus,
  BidStatus,
  MyBidHistoryResponse,
  PageResponse,
  User,
  UserRole,
} from "../../api/types";
import { useDebounce } from "../../hooks/useDebounce";
import formatCurrency, { formatDateTime } from "../../utils/format";
import AccountTrackingDrawer from "../../components/admin/AccountTrackingDrawer";

const AdminUserPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const setPage = (p: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", p.toString());
    setSearchParams(newParams);
  };
  const keyword = searchParams.get("keyword") || "";
  const setKeyword = (k: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (k) newParams.set("keyword", k);
    else newParams.delete("keyword");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  const role = (searchParams.get("role") as UserRole) || undefined;
  const setRole = (r: UserRole | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (r) newParams.set("role", r);
    else newParams.delete("role");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  const status =
    (searchParams.get("status") as "ACTIVE" | "BLOCKED") || undefined;
  const setStatus = (s: "ACTIVE" | "BLOCKED" | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (s) newParams.set("status", s);
    else newParams.delete("status");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  const [historyDrawer, setHistoryDrawer] = useState<{
    visible: boolean;
    type: "bid" | "violation" | "tracking";
    userId?: number;
  }>({ visible: false, type: "bid" });
  const [bidHistoryPage, setBidHistoryPage] = useState(1);
  const [trackingPage, setTrackingPage] = useState(1);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [unblockModalVisible, setUnblockModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [unblockReason, setUnblockReason] = useState("");
  const queryClient = useQueryClient();

  const roleStyles = {
    [UserRole.USER]: { color: "default" },
    [UserRole.SELLER]: { color: "blue" },
    [UserRole.ADMIN]: {
      style: {
        borderColor: "#FED469",
        color: "#FED469",
      },
    },
  };

  const roleOrder: Record<UserRole, number> = {
    [UserRole.USER]: 1,
    [UserRole.SELLER]: 2,
    [UserRole.ADMIN]: 3,
  };

  // Debounce the keyword input (300ms delay)
  const debouncedKeyword = useDebounce(keyword, 300);

  const { data, isLoading } = useQuery<PageResponse<User>>({
    queryKey: ["admin-users", page, debouncedKeyword, role, status],
    queryFn: () => adminApi.getUsers(page, 20, debouncedKeyword, role, status),
  });

  // Fetch bid history for the selected user in the drawer
  const { data: bidHistoryData, isLoading: bidHistoryLoading } = useQuery<
    PageResponse<MyBidHistoryResponse>
  >({
    queryKey: ["user-bid-history", historyDrawer.userId, bidHistoryPage],
    queryFn: () =>
      bidApi.getBidHistoryForAdmin(historyDrawer.userId!, bidHistoryPage, 20),
    enabled:
      historyDrawer.visible &&
      historyDrawer.type === "bid" &&
      !!historyDrawer.userId,
  });

  const blockMutation = useMutation({
    mutationFn: ([userId, reason]: [number, string]) =>
      adminApi.blockUser(userId, reason),
    onSuccess: () => {
      message.success("User blocked successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => message.error("Failed to block user"),
  });

  const unblockMutation = useMutation({
    mutationFn: ([userId, reason]: [number, string]) =>
      adminApi.unblockUser(userId, reason),
    onSuccess: () => {
      message.success("User unblocked successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => message.error("Failed to unblock user"),
  });

  const handleBlock = (userId: number) => {
    setSelectedUserId(userId);
    setBlockReason("");
    setBlockModalVisible(true);
  };

  const handleUnblock = (userId: number) => {
    setSelectedUserId(userId);
    setUnblockReason("");
    setUnblockModalVisible(true);
  };

  const handleBlockConfirm = () => {
    if (blockReason.trim().length < 3) {
      message.error("Please enter a reason with at least 3 characters");
      return;
    }
    if (selectedUserId) {
      blockMutation.mutate([selectedUserId, blockReason]);
      setBlockModalVisible(false);
    }
  };

  const handleUnblockConfirm = () => {
    if (!unblockReason.trim()) {
      message.error("Please enter a reason for unblocking");
      return;
    }
    if (selectedUserId) {
      unblockMutation.mutate([selectedUserId, unblockReason]);
      setUnblockModalVisible(false);
    }
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    setSearchParams(newParams);
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles: UserRole[]) => (
        <Space size={[0, 4]} wrap>
          {roles
            ?.slice() // tránh mutate dữ liệu gốc
            .sort((a, b) => roleOrder[a] - roleOrder[b])
            .map((r) => (
              <Tag key={r} {...roleStyles[r]}>
                {r}
              </Tag>
            ))}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: User) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: User) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "bid-history",
                icon: <EyeOutlined />,
                label: "View Bid History",
                onClick: () =>
                  setHistoryDrawer({
                    visible: true,
                    type: "bid",
                    userId: record.id,
                  }),
              },
              {
                key: "user-audit",
                icon: <HistoryOutlined />,
                label: "Audit Logs",
                onClick: () => {
                  setSelectedUser(record);
                  setTrackingPage(1);
                  setHistoryDrawer({
                    visible: true,
                    type: "tracking",
                    userId: record.id,
                  });
                },
              },
              record.roles?.includes(UserRole.ADMIN)
                ? null
                : record.status === "ACTIVE"
                  ? {
                      key: "block",
                      icon: <StopOutlined />,
                      label: "Block",
                      danger: true,
                      onClick: () => handleBlock(record.id),
                    }
                  : {
                      key: "unblock",
                      icon: <CheckCircleOutlined />,
                      label: "Unblock",
                      onClick: () => handleUnblock(record.id),
                    },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Item",
      dataIndex: "auctionTitle",
      key: "auctionTitle",
      render: (text: string, record: MyBidHistoryResponse) => (
        <span className="text-white">{text}</span>
      ),
    },
    {
      title: "Bid Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt: number) => (
        <span style={{ color: "#FED469" }}>{formatCurrency(amt)}</span>
      ),
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

  const violationColumns = [
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      render: (time: string) => formatDateTime(time),
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: "28px",
        }}
      >
        User Management
      </h1>

      {/* Filter Form */}
      <div
        className="filter-container"
        style={{ animation: "fadeIn 0.35s ease-out" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Search
            </div>
            <Input
              placeholder="Search by Name, Email"
              prefix={
                <SearchOutlined style={{ color: "rgba(255,255,255,0.3)" }} />
              }
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Role
            </div>
            <Select
              placeholder="Select Role"
              value={role}
              onChange={(value) => setRole(value)}
              allowClear
              style={{ width: "100%" }}
              options={[
                { label: "USER", value: "USER" },
                { label: "SELLER", value: "SELLER" },
                { label: "ADMIN", value: "ADMIN" },
              ]}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Status
            </div>
            <Select
              placeholder="Select Status"
              value={status}
              onChange={(value) => setStatus(value)}
              allowClear
              style={{ width: "100%" }}
              options={[
                { label: "ACTIVE", value: "ACTIVE" },
                { label: "BLOCKED", value: "BLOCKED" },
              ]}
            />
          </div>
        </div>
        <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
          <Button type="primary" icon={<SearchOutlined />} loading={isLoading}>
            Search
          </Button>
          <Button icon={<DeleteOutlined />} onClick={handleClearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: data?.currentPage,
          pageSize: data?.pageSize,
          total: data?.totalElements,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
        rowClassName={(record) =>
          record.status === "BLOCKED" ? "opacity-50" : ""
        }
      />

      <Drawer
        title={
          historyDrawer.type === "bid"
            ? "Bid History"
            : historyDrawer.type === "tracking"
              ? `User Audit Logs`
              : "User Audit Logs"
        }
        open={historyDrawer.visible && historyDrawer.type !== "tracking"}
        onClose={() => {
          setHistoryDrawer({ visible: false, type: "bid" });
          setBidHistoryPage(1);
        }}
        styles={{
          body: {
            backgroundColor: "#191B24",
            padding: "24px",
          },
        }}
        size={1000}
      >
        {historyDrawer.type === "bid" ? (
          <div className="account-table-wrapper">
            <Table
              columns={historyColumns}
              dataSource={bidHistoryData?.data}
              rowKey={(record: MyBidHistoryResponse) =>
                `${record.auctionId}-${record.createdAt}`
              }
              size="small"
              loading={bidHistoryLoading}
              pagination={{
                current: bidHistoryData?.currentPage || 1,
                pageSize: bidHistoryData?.pageSize || 20,
                total: bidHistoryData?.totalElements || 0,
                onChange: (p) => setBidHistoryPage(p),
                showSizeChanger: false,
              }}
            />
          </div>
        ) : (
          <Table
            columns={violationColumns}
            dataSource={mockViolations as any}
            rowKey="id"
            pagination={false}
          />
        )}
      </Drawer>

      {/* Account Tracking Drawer - Separate component */}
      <AccountTrackingDrawer
        visible={historyDrawer.visible && historyDrawer.type === "tracking"}
        userId={
          historyDrawer.type === "tracking"
            ? historyDrawer.userId || null
            : null
        }
        user={selectedUser}
        onClose={() => {
          setHistoryDrawer({ visible: false, type: "bid" });
          setSelectedUser(null);
          setTrackingPage(1);
        }}
        page={trackingPage}
        onPageChange={setTrackingPage}
      />

      {/* Block User Modal */}
      <Modal
        title="Block User"
        open={blockModalVisible}
        onOk={handleBlockConfirm}
        onCancel={() => setBlockModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBlockModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="block"
            type="primary"
            danger
            disabled={blockReason.trim().length < 3}
            onClick={handleBlockConfirm}
          >
            Block
          </Button>,
        ]}
      >
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            Reason for blocking:
          </label>
          <Input.TextArea
            placeholder="Enter reason for blocking this user"
            rows={3}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
          <div
            style={{
              color: blockReason.trim().length < 3 ? "#ff4d4f" : "#8c8c8c",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            {blockReason.trim().length} / 3 characters (minimum required)
          </div>
        </div>
      </Modal>

      {/* Unblock User Modal */}
      <Modal
        title="Unblock User"
        open={unblockModalVisible}
        onOk={handleUnblockConfirm}
        onCancel={() => setUnblockModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setUnblockModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="block"
            type="primary"
            danger
            disabled={unblockReason.trim().length < 3}
            onClick={handleUnblockConfirm}
          >
            Unblock
          </Button>,
        ]}
      >
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              color: "#e0e0e0",
            }}
          >
            Reason for unblocking:
          </label>
          <Input.TextArea
            placeholder="Enter reason for unblocking this user"
            rows={3}
            value={unblockReason}
            onChange={(e) => setUnblockReason(e.target.value)}
          />
          <div
            style={{
              color: unblockReason.trim().length < 3 ? "#ff4d4f" : "#8c8c8c",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            {unblockReason.trim().length} / 3 characters (minimum required)
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUserPage;

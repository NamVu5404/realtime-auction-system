import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Card,
  Col,
  Drawer,
  Input,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import adminApi from "../../api/adminApi";
import {
  RequestStatus,
  SellerRegResponse,
  SellerResponse,
  User,
} from "../../api/types";
import SellerStatisticsDashboard from "../../features/auction/SellerStatisticsDashboard";
import formatCurrency from "../../utils/format";
import { getAvatarUrl } from "../../utils/imageUtils";

const { Text } = Typography;
const { TextArea } = Input;

const SellerManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const regPage = parseInt(searchParams.get("regPage") || "1", 20);
  const sellerPage = parseInt(searchParams.get("sellerPage") || "1", 20);

  const setRegPage = (p: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("regPage", p.toString());
    setSearchParams(newParams);
  };

  const setSellerPage = (p: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sellerPage", p.toString());
    setSearchParams(newParams);
  };

  const activeTab = searchParams.get("tab") || "sellers";
  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    setSearchParams(newParams);
  };

  const queryClient = useQueryClient();

  // State for Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [selectedReg, setSelectedReg] = useState<SellerRegResponse | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<
    User | SellerResponse | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const [statDrawerVisible, setStatDrawerVisible] = useState(false);
  const [statUserId, setStatUserId] = useState<number | undefined>();
  const [statUserName, setStatUserName] = useState<string>("");

  // Queries
  const { data: registrations, isLoading: isRegLoading } = useQuery({
    queryKey: ["seller-registrations", regPage],
    queryFn: () => adminApi.getRegistrations(regPage, 20),
  });

  const { data: sellers, isLoading: isSellersLoading } = useQuery({
    queryKey: ["sellers-list", sellerPage],
    queryFn: () => adminApi.getSellers(sellerPage, 20),
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["seller-registrations-pending"],
    queryFn: () => adminApi.getPendingRegistrations(),
  });

  const { data: approvedCount = 0 } = useQuery({
    queryKey: ["seller-registrations-approved"],
    queryFn: () => adminApi.getApprovedRegistrations(),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveSeller(id),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["seller-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["sellers-list"] });
      queryClient.invalidateQueries({
        queryKey: ["seller-registrations-pending"],
      });
      queryClient.invalidateQueries({
        queryKey: ["seller-registrations-approved"],
      });
    },
    onError: (error: any) => message.error(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.rejectSeller(id, reason),
    onSuccess: (data) => {
      message.success(data.message);
      setRejectModalVisible(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["seller-registrations"] });
      queryClient.invalidateQueries({
        queryKey: ["seller-registrations-pending"],
      });
      queryClient.invalidateQueries({
        queryKey: ["seller-registrations-approved"],
      });
    },
    onError: (error: any) => message.error(error.message),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      adminApi.revokeSellerRole(userId, reason),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["sellers-list"] });
    },
    onError: (error: any) => message.error(error.message),
  });

  // Handlers
  const handleApprove = (reg: SellerRegResponse) => {
    setSelectedReg(reg);
    setApproveModalVisible(true);
  };

  const handleApproveConfirm = () => {
    if (selectedReg) {
      approveMutation.mutate(selectedReg.id);
      setApproveModalVisible(false);
    }
  };

  const handleOpenReject = (reg: SellerRegResponse) => {
    setSelectedReg(reg);
    setRejectModalVisible(true);
  };

  const handleReject = () => {
    if (!selectedReg) return;
    if (!rejectReason.trim()) {
      message.warning("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({ id: selectedReg.id, reason: rejectReason });
  };

  const handleRevoke = (user: User | SellerResponse) => {
    setSelectedUser(user);
    setRevokeModalVisible(true);
  };

  const handleRevokeConfirm = () => {
    if (selectedUser) {
      const userId =
        "userId" in selectedUser ? selectedUser.userId : selectedUser.id;
      revokeMutation.mutate({ userId, reason: revokeReason });
      setRevokeModalVisible(false);
      setRevokeReason("");
    }
  };

  const handleOpenStats = (user: SellerResponse) => {
    setStatUserId(user.userId);
    setStatUserName(user.name);
    setStatDrawerVisible(true);
  };

  // Table Columns
  const registrationColumns = [
    {
      title: "User",
      key: "user",
      render: (record: SellerRegResponse) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            src={getAvatarUrl(record.user?.avatarUrl)}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{record.user?.name}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.user?.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Details",
      key: "details",
      render: (record: SellerRegResponse) =>
        record.status === RequestStatus.REJECTED ? (
          <Tooltip title={record.rejectReason}>
            <Text type="danger" style={{ cursor: "pointer" }}>
              Rejection:{" "}
              {(record.rejectReason ?? "").length > 20
                ? record.rejectReason!.substring(0, 20) + "..."
                : record.rejectReason}
            </Text>
          </Tooltip>
        ) : record.status === RequestStatus.APPROVED ? (
          <Text type="success">Approved</Text>
        ) : (
          <Text type="secondary">Awaiting Review</Text>
        ),
    },
    {
      title: "Apply Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: "Processed By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (updatedBy: any, record: any) => {
        const isProcessed = updatedBy && updatedBy !== record.createdBy;

        return isProcessed ? updatedBy : "-";
      },
    },
    {
      title: "Processed Date",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (updatedAt: string, record: any) => {
        const isModified =
          updatedAt && record.createdAt && updatedAt !== record.createdAt;

        return isModified ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm") : "-";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: SellerRegResponse) =>
        record.status === RequestStatus.PENDING && (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record)}
              loading={
                approveMutation.isPending &&
                approveMutation.variables === record.id
              }
            >
              Approve
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleOpenReject(record)}
            >
              Reject
            </Button>
          </Space>
        ),
    },
  ];

  const sellerColumns = [
    {
      title: "Seller",
      key: "user",
      render: (record: SellerResponse) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            src={getAvatarUrl(record.avatarUrl)}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (record: SellerResponse) => (
        <Space direction="vertical" size={0}>
          {record.phone && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              📱 {record.phone}
            </Text>
          )}
          {record.location && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              📍 {record.location}
            </Text>
          )}
          {!record.phone && !record.location && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              -
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Auctions",
      key: "auctions",
      render: (record: SellerResponse) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.totalAuctions} Total</Text>
          <Text style={{ fontSize: "12px", color: "#10b981" }}>
            ● {record.liveAuctions} Live
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            ○ {record.endedAuctions} Ended
          </Text>
        </Space>
      ),
    },
    {
      title: "Total Revenue",
      key: "revenue",
      render: (record: SellerResponse) => (
        <Text
          strong
          style={{ color: "var(--color-gold-start)", fontSize: "15px" }}
        >
          {formatCurrency(record.totalRevenue)}
        </Text>
      ),
    },
    {
      title: "Approved Date",
      key: "approvedAt",
      render: (record: SellerResponse) =>
        record.approvedAt
          ? dayjs(record.approvedAt).format("YYYY-MM-DD HH:mm")
          : "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: SellerResponse) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => handleOpenStats(record)}
          >
            Statistics
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleRevoke(record)}
            loading={
              revokeMutation.isPending &&
              revokeMutation.variables?.userId === record.userId
            }
          >
            Revoke Role
          </Button>
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: "sellers",
      label: (
        <span>
          <TeamOutlined /> Active Sellers
        </span>
      ),
      children: (
        <Table
          columns={sellerColumns}
          dataSource={sellers?.data || []}
          loading={isSellersLoading}
          rowKey="userId"
          scroll={{ x: "max-content" }}
          pagination={{
            current: sellerPage,
            pageSize: 20,
            total: sellers?.totalElements || 0,
            onChange: (p) => setSellerPage(p),
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} items`,
          }}
          className="admin-table"
        />
      ),
    },
    {
      key: "requests",
      label: (
        <span>
          <ClockCircleOutlined /> Registration Requests
          {registrations?.data.some(
            (r) => r.status === RequestStatus.PENDING,
          ) && (
            <Tag
              style={{
                marginLeft: 8,
                borderRadius: "10px",
                fontSize: "10px",
                color: "#FED469",
                borderColor: "#FFC53D",
              }}
            >
              NEW
            </Tag>
          )}
        </span>
      ),
      children: (
        <Table
          columns={registrationColumns}
          dataSource={registrations?.data || []}
          loading={isRegLoading}
          rowKey="id"
          scroll={{ x: "max-content" }}
          pagination={{
            current: regPage,
            pageSize: 20,
            total: registrations?.totalElements || 0,
            onChange: (p) => setRegPage(p),
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} items`,
          }}
          className="admin-table"
        />
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
        Seller Management
      </h1>

      {/* Stats Summary */}
      <Row gutter={24} style={{ marginBottom: "32px" }}>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Sellers"
              value={sellers?.totalElements || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Pending Requests"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Requests"
              value={registrations?.totalElements || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Approval Rate"
              value={
                registrations?.totalElements
                  ? (approvedCount / registrations.totalElements) * 100
                  : 0
              }
              precision={1}
              prefix={<CheckCircleOutlined />}
              suffix="%"
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        className="admin-tabs"
      />

      <Modal
        title="Reject Registration"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason("");
        }}
        confirmLoading={rejectMutation.isPending}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRejectModalVisible(false);
              setRejectReason("");
            }}
          >
            Close
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            disabled={!rejectReason.trim()}
            onClick={handleReject}
            loading={rejectMutation.isPending}
          >
            Reject
          </Button>,
        ]}
      >
        <div style={{ marginBottom: "16px" }}>
          <Text strong style={{ color: "rgba(255,255,255,0.7)" }}>
            User:{" "}
          </Text>
          <Text style={{ color: "#fff" }}>
            {selectedReg?.user?.name} ({selectedReg?.user?.email})
          </Text>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <Text strong style={{ color: "rgba(255,255,255,0.7)" }}>
            Reason for Rejection:{" "}
          </Text>
        </div>
        <TextArea
          rows={4}
          placeholder="Please explain why this registration is being rejected..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* Approve Modal */}
      <Modal
        title="Approve Seller Registration"
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApproveModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={handleApproveConfirm}
            loading={approveMutation.isPending}
          >
            Approve
          </Button>,
        ]}
      >
        <div style={{ padding: "16px 0" }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>
            Are you sure you want to approve the following registration?
          </p>
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Space>
              <Avatar
                icon={<UserOutlined />}
                src={getAvatarUrl(selectedReg?.user?.avatarUrl)}
              />
              <Space direction="vertical" size={0}>
                <Text strong style={{ color: "#fff" }}>
                  {selectedReg?.user?.name}
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {selectedReg?.user?.email}
                </Text>
              </Space>
            </Space>
          </div>
          <p
            style={{
              marginTop: "20px",
              color: "#A78BFA",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <InfoCircleOutlined /> This user will be granted the SELLER role and
            can start listing auctions.
          </p>
        </div>
      </Modal>

      {/* Revoke Modal */}
      <Modal
        title="Revoke Seller Role"
        open={revokeModalVisible}
        onCancel={() => setRevokeModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRevokeModalVisible(false);
              setRevokeReason("");
            }}
          >
            Close
          </Button>,
          <Button
            key="revoke"
            type="primary"
            danger
            onClick={handleRevokeConfirm}
            loading={revokeMutation.isPending}
          >
            Revoke
          </Button>,
        ]}
      >
        <div style={{ padding: "16px 0" }}>
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(248, 113, 113, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ExclamationCircleOutlined
                style={{ fontSize: "24px", color: "#f87171" }}
              />
            </div>
            <div>
              <p
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "15px",
                  margin: "0 0 12px 0",
                }}
              >
                Are you sure you want to revoke the SELLER role from{" "}
                <span style={{ color: "var(--color-gold-start)" }}>
                  {selectedUser?.name}
                </span>
                ?
              </p>
              <div
                style={{
                  padding: "12px",
                  background: "rgba(248, 113, 113, 0.05)",
                  borderRadius: "8px",
                  border: "1px solid rgba(248, 113, 113, 0.2)",
                }}
              >
                <p
                  style={{
                    color: "#f87171",
                    fontSize: "13px",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <InfoCircleOutlined /> This will also cancel all of their
                  DRAFT and SCHEDULED auctions.
                </p>
              </div>
              <div style={{ marginTop: "16px" }}>
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
                  Reason (optional)
                </div>
                <TextArea
                  rows={3}
                  placeholder="Provide a reason for revoking this seller's role..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Seller Statistics Drawer */}
      <Drawer
        title={
          <Space>
            <span>
              Statistics for{" "}
              <span style={{ color: "#fff" }}>{statUserName}</span>
            </span>
          </Space>
        }
        placement="right"
        size={1000}
        onClose={() => setStatDrawerVisible(false)}
        open={statDrawerVisible}
        destroyOnHidden
      >
        {statUserId && <SellerStatisticsDashboard sellerId={statUserId} />}
      </Drawer>
    </div>
  );
};

export default SellerManagementPage;

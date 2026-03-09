import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Card,
  message,
  Modal,
  Input,
  Tooltip,
  Tabs,
  Row,
  Col,
  Statistic,
  Avatar,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../api/adminApi";
import {
  RequestStatus,
  SellerRegResponse,
  User,
  UserRole,
} from "../../api/types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const SellerManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const regPage = parseInt(searchParams.get("regPage") || "1", 10);
  const sellerPage = parseInt(searchParams.get("sellerPage") || "1", 10);

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Queries
  const { data: registrations, isLoading: isRegLoading } = useQuery({
    queryKey: ["seller-registrations", regPage],
    queryFn: () => adminApi.getRegistrations(regPage, 10),
  });

  const { data: sellers, isLoading: isSellersLoading } = useQuery({
    queryKey: ["sellers-list", sellerPage],
    queryFn: () =>
      adminApi.getUsers(sellerPage, 10, undefined, UserRole.SELLER),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveSeller(id),
    onSuccess: () => {
      message.success("Seller registration approved successfully");
      queryClient.invalidateQueries({ queryKey: ["seller-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["sellers-list"] });
    },
    onError: () => message.error("Failed to approve registration"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.rejectSeller(id, reason),
    onSuccess: () => {
      message.success("Seller registration rejected");
      setRejectModalVisible(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["seller-registrations"] });
    },
    onError: () => message.error("Failed to reject registration"),
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: number) => adminApi.revokeSellerRole(userId),
    onSuccess: () => {
      message.success(
        "Seller role revoked successfully. All scheduled auctions by this user have been cancelled.",
      );
      queryClient.invalidateQueries({ queryKey: ["sellers-list"] });
    },
    onError: () => message.error("Failed to revoke seller role"),
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

  const handleRevoke = (user: User) => {
    setSelectedUser(user);
    setRevokeModalVisible(true);
  };

  const handleRevokeConfirm = () => {
    if (selectedUser) {
      revokeMutation.mutate(selectedUser.id);
      setRevokeModalVisible(false);
    }
  };

  // Table Columns
  const registrationColumns = [
    {
      title: "User",
      key: "user",
      render: (record: SellerRegResponse) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.user?.avatarUrl} />
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: RequestStatus) => {
        let color = "blue";
        if (status === RequestStatus.APPROVED) color = "green";
        if (status === RequestStatus.REJECTED) color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Applied At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: "Details",
      key: "details",
      render: (record: SellerRegResponse) =>
        record.status === RequestStatus.REJECTED ? (
          <Tooltip title={record.rejectReason}>
            <Text type="danger" style={{ fontSize: "12px", cursor: "help" }}>
              Rejection:{" "}
              {(record.rejectReason ?? "").length > 20
                ? record.rejectReason!.substring(0, 20) + "..."
                : record.rejectReason}
            </Text>
          </Tooltip>
        ) : record.approvedAt ? (
          <Text type="success" style={{ fontSize: "12px" }}>
            Approved: {dayjs(record.approvedAt).format("YYYY-MM-DD HH:mm")}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Awaiting Review
          </Text>
        ),
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
      render: (record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatarUrl} />
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status?: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>
          {status || "ACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: User) => (
        <Space>
          {!record.roles.includes(UserRole.ADMIN) && (
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleRevoke(record)}
              loading={
                revokeMutation.isPending &&
                revokeMutation.variables === record.id
              }
            >
              Revoke Seller Role
            </Button>
          )}
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
          rowKey="id"
          pagination={{
            current: sellerPage,
            pageSize: 10,
            total: sellers?.totalElements || 0,
            onChange: (p) => setSellerPage(p),
            showSizeChanger: false,
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
          pagination={{
            current: regPage,
            pageSize: 10,
            total: registrations?.totalElements || 0,
            onChange: (p) => setRegPage(p),
            showSizeChanger: false,
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
          marginBottom: "28px",
        }}
      >
        Seller Management
      </h1>

      {/* Stats Summary */}
      <Row gutter={24} style={{ marginBottom: "32px" }}>
        <Col span={8}>
          <Card className="stats-card">
            <Statistic
              title="Total Sellers"
              value={sellers?.totalElements || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stats-card">
            <Statistic
              title="Pending Requests"
              value={
                registrations?.data.filter(
                  (r) => r.status === RequestStatus.PENDING,
                ).length || 0
              }
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stats-card">
            <Statistic
              title="Total Requests"
              value={registrations?.totalElements || 0}
              prefix={<TeamOutlined />}
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
                src={selectedReg?.user?.avatarUrl}
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
          <Button key="cancel" onClick={() => setRevokeModalVisible(false)}>
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
                <strong>{selectedUser?.name}</strong>?
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
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SellerManagementPage;

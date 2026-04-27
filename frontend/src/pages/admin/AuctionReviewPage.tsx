import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Card,
  Col,
  Input,
  message,
  Modal,
  Row,
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
import { Auction, AuctionStatus } from "../../api/types";
import AuctionAuditDrawer from "./drawers/AuctionAuditDrawer";
import { AuctionDetailDrawer } from "./drawers/AuctionDetailDrawer";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const AuctionReviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const setPage = (p: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", p.toString());
    setSearchParams(newParams);
  };

  const queryClient = useQueryClient();

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [detailAuction, setDetailAuction] = useState<Auction | undefined>();
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [auditAuctionId, setAuditAuctionId] = useState<number | null>(null);
  const [auditDrawerVisible, setAuditDrawerVisible] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  const { data: auctions, isLoading } = useQuery({
    queryKey: ["pending-review-auctions", page],
    queryFn: () => adminApi.getPendingAuctionReviews(page, 20),
    refetchInterval: 30000,
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-review-count"],
    queryFn: () => adminApi.getPendingAuctionReviewCount(),
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveAuction(id),
    onSuccess: (data) => {
      message.success(data.message);
      setApproveModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["pending-review-auctions"] });
      queryClient.invalidateQueries({ queryKey: ["pending-review-count"] });
    },
    onError: (error: any) => message.error(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.rejectAuction(id, reason),
    onSuccess: (data) => {
      message.success(data.message);
      setRejectModalVisible(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["pending-review-auctions"] });
      queryClient.invalidateQueries({ queryKey: ["pending-review-count"] });
    },
    onError: (error: any) => message.error(error.message),
  });

  const handleOpenApprove = (auction: Auction) => {
    setSelectedAuction(auction);
    setApproveModalVisible(true);
  };

  const handleOpenReject = (auction: Auction) => {
    setSelectedAuction(auction);
    setRejectModalVisible(true);
  };

  const handleApproveConfirm = () => {
    if (selectedAuction) approveMutation.mutate(selectedAuction.id);
  };

  const handleRejectConfirm = () => {
    if (!selectedAuction) return;
    if (!rejectReason.trim()) {
      message.warning("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({ id: selectedAuction.id, reason: rejectReason });
  };

  const columns = [
    {
      title: "Auction",
      key: "auction",
      render: (record: Auction) => (
        <Space>
          {record.image ? (
            <img
              src={record.image}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ClockCircleOutlined style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
          )}
          <Space direction="vertical" size={2}>
            <Text strong style={{ maxWidth: 220, display: "block" }}>
              {record.title}
            </Text>
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ fontSize: 12, margin: 0, maxWidth: 220 }}
            >
              {record.description}
            </Paragraph>
          </Space>
        </Space>
      ),
    },
    {
      title: "Seller",
      key: "seller",
      render: (record: Auction) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{record.seller?.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.seller?.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Start Price",
      key: "price",
      render: (record: Auction) => (
        <Text strong style={{ color: "var(--color-gold-start)" }}>
          {record.startPrice?.toLocaleString("vi-VN")}₫
        </Text>
      ),
    },
    {
      title: "Schedule",
      key: "schedule",
      render: (record: Auction) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Start: </span>
            {dayjs(record.startTime).format("DD/MM/YYYY HH:mm")}
          </Text>
          <Text style={{ fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>End: </span>
            {dayjs(record.endTime).format("DD/MM/YYYY HH:mm")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (record: Auction) => (
        <Tag
          color="orange"
          icon={<RobotOutlined />}
          style={{ borderRadius: 6 }}
        >
          {record.status === AuctionStatus.PENDING_REVIEW
            ? "Pending Review"
            : record.status}
        </Tag>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Auction) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setDetailAuction(record);
                setDetailDrawerVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="View Audit Log">
            <Button
              icon={<ClockCircleOutlined />}
              size="small"
              onClick={() => {
                setAuditAuctionId(record.id);
                setAuditPage(1);
                setAuditDrawerVisible(true);
              }}
            />
          </Tooltip>
          {record.status === AuctionStatus.PENDING_REVIEW && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleOpenApprove(record)}
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
            </>
          )}
        </Space>
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
        Auction Review
      </h1>

      <Row gutter={24} style={{ marginBottom: "32px" }}>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Pending Review"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stats-card">
            <Statistic
              title="Total in Queue"
              value={auctions?.totalElements || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: "#FED469" }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={auctions?.data || []}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize: 20,
          total: auctions?.totalElements || 0,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} items`,
        }}
        className="admin-table"
      />

      {/* Approve Modal */}
      <Modal
        title="Approve Auction"
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApproveModalVisible(false)}>
            Cancel
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
            Are you sure you want to approve this auction?
          </p>
          <div
            style={{
              padding: "16px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.05)",
              marginTop: "16px",
            }}
          >
            <Text strong style={{ color: "#fff" }}>
              {selectedAuction?.title}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Seller: {selectedAuction?.seller?.name}
            </Text>
          </div>
          <p
            style={{
              marginTop: "16px",
              color: "#A78BFA",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <InfoCircleOutlined />
            If startTime has already passed, the auction will be set to DRAFT
            status so the seller can reschedule.
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Auction"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRejectModalVisible(false);
              setRejectReason("");
            }}
          >
            Cancel
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            disabled={!rejectReason.trim()}
            onClick={handleRejectConfirm}
            loading={rejectMutation.isPending}
          >
            Reject
          </Button>,
        ]}
      >
        <div style={{ padding: "8px 0" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(248,113,113,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ExclamationCircleOutlined style={{ fontSize: "20px", color: "#f87171" }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                Rejecting:{" "}
                <span style={{ color: "var(--color-gold-start)" }}>
                  {selectedAuction?.title}
                </span>
              </Text>
              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Reason for Rejection *
                </div>
                <TextArea
                  rows={4}
                  placeholder="Explain why this auction is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <AuctionDetailDrawer
        auction={detailAuction}
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      />

      <AuctionAuditDrawer
        auctionId={auditAuctionId}
        auctionTitle={auditAuctionId ? auctions?.data.find(a => a.id === auditAuctionId)?.title : undefined}
        visible={auditDrawerVisible}
        onClose={() => setAuditDrawerVisible(false)}
        page={auditPage}
        onPageChange={setAuditPage}
      />
    </div>
  );
};

export default AuctionReviewPage;

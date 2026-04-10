import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  message,
  Modal,
  Tabs,
  Row,
  Col,
  Statistic,
  Tag,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  MailOutlined,
  EyeOutlined,
  SolutionOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import contactApi from "../../api/contactApi";
import { ContactResponse } from "../../api/types";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ContactManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingPage = parseInt(searchParams.get("pendingPage") || "1", 10);
  const processedPage = parseInt(searchParams.get("processedPage") || "1", 10);
  const activeTab = searchParams.get("tab") || "pending";

  const setPendingPage = (p: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("pendingPage", p.toString());
    setSearchParams(newParams);
  };

  const setProcessedPage = (p: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("processedPage", p.toString());
    setSearchParams(newParams);
  };

  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    setSearchParams(newParams);
  };

  const queryClient = useQueryClient();

  // State for View-Detail Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<ContactResponse | null>(null);

  // Queries
  const { data: pendingData, isLoading: isPendingLoading } = useQuery({
    queryKey: ["contacts-pending", pendingPage],
    queryFn: () => contactApi.getPendingContacts(pendingPage, 20),
  });

  const { data: processedData, isLoading: isProcessedLoading } = useQuery({
    queryKey: ["contacts-processed", processedPage],
    queryFn: () => contactApi.getProcessedContacts(processedPage, 20),
  });

  // Mutations
  const processMutation = useMutation({
    mutationFn: (id: number) => contactApi.markAsProcessed(id),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["contacts-pending"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-processed"] });
    },
    onError: (error: any) => message.error(error.message),
  });

  // Handlers
  const handleViewDetails = (contact: ContactResponse) => {
    setSelectedContact(contact);
    setDetailModalVisible(true);
  };

  const handleMarkAsProcessed = (id: number) => {
    processMutation.mutate(id);
  };

  const commonColumns = [
    {
      title: "Sender",
      key: "sender",
      render: (record: ContactResponse) => (
        <Space direction="vertical" size={0}>
          <Text strong>{`${record.firstName} ${record.lastName}`}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Message Preview",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => (
        <Tooltip title="View full message">
          <Text
            ellipsis
            style={{
              maxWidth: 200,
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              // handleViewDetails will be called via action button usually, but tooltip here is nice
            }}
          >
            {desc}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Submitted At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      sorter: (a: ContactResponse, b: ContactResponse) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
  ];

  const pendingColumns = [
    ...commonColumns,
    {
      title: "Action",
      key: "action",
      render: (record: ContactResponse) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            className="hover:text-gold"
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={
              processMutation.isPending &&
              processMutation.variables === record.id
            }
            onClick={() => handleMarkAsProcessed(record.id)}
          >
            Mark Handled
          </Button>
        </Space>
      ),
    },
  ];

  const processedColumns = [
    ...commonColumns,
    {
      title: "Processed By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (by: string) => by || "System",
    },
    {
      title: "Processed At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Action",
      key: "action",
      render: (record: ContactResponse) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View Detail
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: "pending",
      label: (
        <span>
          <ClockCircleOutlined /> Pending
          {pendingData?.totalElements ? (
            <Tag
              style={{
                marginLeft: 8,
                borderRadius: "10px",
                color: "#FED469",
                borderColor: "#FFC53D",
              }}
            >
              {pendingData.totalElements}
            </Tag>
          ) : null}
        </span>
      ),
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingData?.data || []}
          loading={isPendingLoading}
          rowKey="id"
          scroll={{ x: "max-content" }}
          pagination={{
            current: pendingPage,
            pageSize: 20,
            total: pendingData?.totalElements || 0,
            onChange: (p) => setPendingPage(p),
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} items`,
          }}
          className="admin-table"
        />
      ),
    },
    {
      key: "processed",
      label: (
        <span>
          <CheckCircleOutlined /> Processed
        </span>
      ),
      children: (
        <Table
          columns={processedColumns}
          dataSource={processedData?.data || []}
          loading={isProcessedLoading}
          rowKey="id"
          scroll={{ x: "max-content" }}
          pagination={{
            current: processedPage,
            pageSize: 20,
            total: processedData?.totalElements || 0,
            onChange: (p) => setProcessedPage(p),
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
          marginBottom: "28px",
        }}
      >
        Contact Management
      </h1>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="admin-tabs"
      />

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <SolutionOutlined style={{ color: "#FED469" }} />
            <span>Inquiry Details</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedContact && !selectedContact.processed && (
            <Button
              key="process"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={processMutation.isPending}
              onClick={() => {
                handleMarkAsProcessed(selectedContact.id);
                setDetailModalVisible(false);
              }}
            >
              Mark as Processed
            </Button>
          ),
        ]}
        width={700}
        centered
      >
        {selectedContact && (
          <div style={{ padding: "10px 0" }}>
            <Row gutter={[16, 24]}>
              <Col span={12}>
                <div style={{ marginBottom: "4px" }}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    From
                  </Text>
                </div>
                <Space>
                  <div>
                    <Text strong style={{ display: "block", color: "#fff" }}>
                      {`${selectedContact.firstName} ${selectedContact.lastName}`}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {selectedContact.email}
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: "4px" }}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Status
                  </Text>
                </div>
                <span
                  style={{
                    margin: 0,
                    color: selectedContact.processed ? "#0CAE7A" : "#fed469",
                  }}
                >
                  {selectedContact.processed ? "Processed" : "Awaiting Review"}
                </span>
              </Col>

              <Col span={24}>
                <div style={{ marginBottom: "8px" }}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Subject
                  </Text>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <Text strong style={{ color: "#FED469", fontSize: "16px" }}>
                    {selectedContact.subject}
                  </Text>
                </div>
              </Col>

              <Col span={24}>
                <div style={{ marginBottom: "8px" }}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Message Body
                  </Text>
                </div>
                <div
                  style={{
                    padding: "20px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    minHeight: "150px",
                    lineHeight: "1.6",
                    color: "rgba(255, 255, 255, 0.85)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedContact.description}
                </div>
              </Col>

              <Col span={24}>
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(16, 185, 129, 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(16, 185, 129, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <InfoCircleOutlined style={{ color: "#10B981" }} />
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    {selectedContact.processed
                      ? `This inquiry was processed by ${selectedContact.updatedBy || "System"} on ${dayjs(selectedContact.updatedAt).format("MMMM D, YYYY at HH:mm")}.`
                      : `Received on ${dayjs(selectedContact.createdAt).format("MMMM D, YYYY at HH:mm")}.`}
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContactManagementPage;

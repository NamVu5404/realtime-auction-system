import { useState } from "react";
import {
  Table,
  Input,
  Tabs,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  Upload,
  message,
  Image,
  Dropdown,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  StopOutlined,
  UploadOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Auction, AuctionStatus, PageResponse } from "../../api/types";
import adminApi from "../../api/adminApi";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { useDebounce } from "../../hooks/useDebounce";
import AuctionDetailDrawer from "../../components/admin/AuctionDetailDrawer";
import dayjs from "dayjs";

const DEFAULT_IMAGE =
  "https://png.pngtree.com/background/20231030/original/pngtree-courtroom-judgement-dark-wooden-stand-with-gavel-and-auction-hammer-3d-picture-image_5798933.jpg";

const { RangePicker } = DatePicker;

const AdminAuctionPage = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<AuctionStatus>(AuctionStatus.LIVE);
  const [dateRange, setDateRange] = useState<any>(null);
  const [detailDrawer, setDetailDrawer] = useState<{
    visible: boolean;
    auction?: Auction;
  }>({ visible: false });
  const [createModal, setCreateModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Debounce the keyword input (500ms delay)
  const debouncedKeyword = useDebounce(keyword, 500);

  // Manual trigger for search - initial query with LIVE status
  const { data, isLoading, refetch } = useQuery<PageResponse<Auction>>({
    queryKey: ["admin-auctions", page, debouncedKeyword, status, dateRange],
    queryFn: () =>
      adminApi.getAuctions(
        page,
        20,
        debouncedKeyword,
        status,
        dateRange?.[0]?.toISOString(),
        dateRange?.[1]?.toISOString(),
      ),
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createAuction,
    onSuccess: () => {
      message.success("Auction created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      setCreateModal(false);
      form.resetFields();
      refetch();
    },
    onError: () => message.error("Failed to create auction"),
  });

  const cancelMutation = useMutation({
    mutationFn: adminApi.cancelAuction,
    onSuccess: () => {
      message.success("Auction cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      refetch();
    },
    onError: () => message.error("Failed to cancel auction"),
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleClear = () => {
    setKeyword("");
    setStatus(AuctionStatus.LIVE);
    setDateRange(null);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
  };

  const handleCreate = (values: any) => {
    const formData = new FormData();

    // Convert DatePicker values to ISO strings with minute precision
    let startTimeStr = "";
    let endTimeStr = "";

    if (values.startTime) {
      startTimeStr = values.startTime.toISOString();
    }
    if (values.endTime) {
      endTimeStr = values.endTime.toISOString();
    }

    Object.keys(values).forEach((key) => {
      if (key === "image" && values[key]?.[0]) {
        formData.append(key, values[key][0].originFileObj);
      } else if (key === "startTime") {
        formData.append(key, startTimeStr);
      } else if (key === "endTime") {
        formData.append(key, endTimeStr);
      } else {
        formData.append(key, values[key]);
      }
    });
    createMutation.mutate(formData);
  };

  const handleCancel = (auctionId: number) => {
    Modal.confirm({
      title: "Cancel Auction",
      content: (
        <Form layout="vertical">
          <Form.Item label="Cancellation Reason (Optional)">
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        cancelMutation.mutate(auctionId);
        setCancelReason("");
      },
      onCancel: () => setCancelReason(""),
    });
  };

  const getStatusColor = (status: AuctionStatus): string => {
    switch (status) {
      case AuctionStatus.LIVE:
        return "green";
      case AuctionStatus.SCHEDULED:
        return "blue";
      case AuctionStatus.DRAFT:
        return "orange";
      case AuctionStatus.ENDED:
        return "red";
      case AuctionStatus.CANCELLED:
        return "default";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image: string) => (
        <Image src={image || DEFAULT_IMAGE} width={50} height={50} />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Creator",
      dataIndex: "seller",
      key: "seller",
      render: (seller: any) => seller?.name,
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AuctionStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Auction) => {
        const menuItems = [];

        // Always show View Detail
        menuItems.push({
          key: "view-detail",
          icon: <EyeOutlined />,
          label: "View Detail",
          onClick: () => setDetailDrawer({ visible: true, auction: record }),
        });

        // Show Cancel only for DRAFT or SCHEDULED
        if (
          record.status === AuctionStatus.DRAFT ||
          record.status === AuctionStatus.SCHEDULED
        ) {
          menuItems.push({
            key: "cancel",
            icon: <StopOutlined />,
            label: "Cancel",
            danger: true,
            onClick: () => handleCancel(record.id),
          });
        }

        // Show View Logs only for LIVE or ENDED
        if (
          record.status === AuctionStatus.LIVE ||
          record.status === AuctionStatus.ENDED
        ) {
          menuItems.push({
            key: "view-logs",
            icon: <EyeOutlined />,
            label: "View Logs",
            onClick: () => setDetailDrawer({ visible: true, auction: record }),
          });
        }

        return (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Auction Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModal(true)}
        >
          Create Auction
        </Button>
      </div>

      {/* Tabs for Status Filter */}
      <div className="mb-6">
        <Tabs
          activeKey={status}
          onChange={(key) => {
            setStatus(key as AuctionStatus);
            setPage(1);
          }}
          items={[
            { label: "LIVE", key: AuctionStatus.LIVE },
            { label: "DRAFT", key: AuctionStatus.DRAFT },
            { label: "SCHEDULED", key: AuctionStatus.SCHEDULED },
            { label: "ENDED", key: AuctionStatus.ENDED },
            { label: "CANCELLED", key: AuctionStatus.CANCELLED },
          ]}
        />
      </div>

      {/* Search Form with Manual Trigger */}
      <Form layout="vertical" className="mb-6 bg-zinc-900 p-4 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item label="Search">
            <Input
              placeholder="Search ID, Title, Description"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item label="Date Range">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              showTime
              format="YYYY-MM-DD HH:mm"
              className="w-full"
            />
          </Form.Item>
        </div>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={isLoading}
            >
              Search
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleClear}>
              Clear
            </Button>
          </Space>
        </Form.Item>
      </Form>

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
        className="bg-zinc-900"
      />

      <AuctionDetailDrawer
        auction={detailDrawer.auction}
        visible={detailDrawer.visible}
        onClose={() => setDetailDrawer({ visible: false })}
      />

      <Modal
        title="Create Auction"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Enter auction title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter auction description" />
          </Form.Item>
          <Form.Item
            name="startPrice"
            label="Start Price"
            rules={[{ required: true, message: "Start price is required" }]}
          >
            <Input type="number" placeholder="0.00" />
          </Form.Item>
          <Form.Item
            name="minStep"
            label="Minimum Step (Bid Increment)"
            rules={[{ required: true, message: "Step is required" }]}
          >
            <Input type="number" placeholder="0.00" />
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Start Time (Minute Precision)"
            rules={[
              { required: true, message: "Start time is required" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (value.isAfter(dayjs())) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Start time must be in the future"),
                  );
                },
              },
            ]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="End Time (Minute Precision)"
            rules={[
              { required: true, message: "End time is required" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const startTime = form.getFieldValue("startTime");
                  if (!startTime) {
                    return Promise.reject(new Error("Set start time first"));
                  }
                  if (value.isAfter(startTime)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("End time must be after start time"),
                  );
                },
              },
            ]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item
            name="image"
            label="Image"
            rules={[{ required: true, message: "Image is required" }]}
          >
            <Upload listType="picture-card" maxCount={1} accept="image/*">
              <div>
                <UploadOutlined />
                <div className="mt-2">Upload</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  form.setFieldsValue({ status: AuctionStatus.DRAFT });
                  handleCreate(form.getFieldsValue());
                }}
              >
                Save as Draft
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                onClick={() =>
                  form.setFieldsValue({ status: AuctionStatus.SCHEDULED })
                }
              >
                Publish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default AdminAuctionPage;

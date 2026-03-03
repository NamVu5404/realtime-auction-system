import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  Dropdown,
  Form,
  Image,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import adminApi from "../../api/adminApi";
import {
  Auction,
  AuctionStatus,
  CancelAuctionRequest,
  PageResponse,
} from "../../api/types";
import CancelAuctionModal from "../../components/admin/CancelAuctionModal";
import AuctionForm from "../../features/auction/AuctionForm";
import { useDebounce } from "../../hooks/useDebounce";
import { convertUTCToLocal } from "../../utils/dateUtils";
import { formatDateTime } from "../../utils/format";
import { getStatusColor } from "../../utils/statusUtils";
import { getImageUrl, DEFAULT_AUCTION_IMAGE } from "../../utils/imageUtils";
import AuctionAuditDrawer from "./drawers/AuctionAuditDrawer";
import AuctionDetailDrawer from "./drawers/AuctionDetailDrawer";

const DEFAULT_IMAGE = DEFAULT_AUCTION_IMAGE;

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
  const [auditDrawer, setAuditDrawer] = useState<{
    visible: boolean;
    auctionId?: number;
    auctionTitle?: string;
  }>({ visible: false });
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{
    visible: boolean;
    auction?: Auction;
  }>({ visible: false });
  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    auctionId?: number;
    auctionTitle?: string;
  }>({ visible: false });
  const [liveAuctions, setLiveAuctions] = useState<Set<number>>(new Set());
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Debounce the keyword input (300ms delay)
  const debouncedKeyword = useDebounce(keyword, 300);

  // Manual trigger for search - initial query with LIVE status
  const { data, isLoading, refetch } = useQuery<PageResponse<Auction>>({
    queryKey: ["admin-auctions", page, debouncedKeyword, status, dateRange],
    queryFn: () =>
      adminApi.filterAuctions(
        page,
        20,
        debouncedKeyword,
        status,
        dateRange?.[0]?.toISOString(),
        dateRange?.[1]?.toISOString(),
      ),
    enabled: true,
  });

  // 1-second interval check: Disable Edit/Cancel if now() >= startTime
  useEffect(() => {
    const interval = setInterval(() => {
      const now = dayjs();
      const updated = new Set<number>();

      if (data?.data) {
        data.data.forEach((auction) => {
          if (auction.status === AuctionStatus.SCHEDULED) {
            const startTimeLocal = convertUTCToLocal(auction.startTime);
            // If current time >= startTime, mark as LIVE (auction has started)
            if (now.isAfter(startTimeLocal) || now.isSame(startTimeLocal)) {
              updated.add(auction.id);
            }
          }
        });
      }

      setLiveAuctions(updated);
    }, 1000); // Check every 1 second

    return () => clearInterval(interval);
  }, [data?.data]);

  const createMutation = useMutation({
    mutationFn: adminApi.scheduleAuction,
    onSuccess: () => {
      message.success("Auction created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      setCreateModal(false);
      form.resetFields();
      refetch();
    },
    onError: () => message.error("Failed to create auction"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (editModal.auction?.status === AuctionStatus.DRAFT) {
        return adminApi.updateDraftAuction(id, data);
      } else if (editModal.auction?.status === AuctionStatus.SCHEDULED) {
        return adminApi.updateScheduledAuction(id, data);
      }
      throw new Error("Unknown auction status");
    },
    onSuccess: () => {
      message.success("Auction updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      setEditModal({ visible: false });
      editForm.resetFields();
      refetch();
    },
    onError: () => message.error("Failed to update auction"),
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: CancelAuctionRequest;
    }) => adminApi.cancelAuction(id, request),
    onSuccess: () => {
      message.success("Auction cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      setCancelModal({ visible: false });
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

  const handleCreateSuccess = () => {
    setCreateModal(false);
    form.resetFields();
    refetch();
  };

  const handleEditSuccess = () => {
    setEditModal({ visible: false });
    editForm.resetFields();
    refetch();
  };

  const handleCancelClick = (auction: Auction) => {
    // Check if auction is still cancellable (not already live/ended)
    const now = dayjs();
    const startTimeLocal = convertUTCToLocal(auction.startTime);

    if (
      auction.status === AuctionStatus.SCHEDULED &&
      now.isAfter(startTimeLocal)
    ) {
      message.error("Cannot cancel: Auction has already started");
      return;
    }

    setCancelModal({
      visible: true,
      auctionId: auction.id,
      auctionTitle: auction.title,
    });
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image: string) => (
        <Image
          src={getImageUrl(image)}
          width={50}
          height={50}
          fallback={DEFAULT_IMAGE}
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Seller",
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
        const isLiveNow = liveAuctions.has(record.id);
        const canEdit =
          (record.status === AuctionStatus.DRAFT ||
            record.status === AuctionStatus.SCHEDULED) &&
          !isLiveNow;
        const canCancel =
          (record.status === AuctionStatus.DRAFT ||
            record.status === AuctionStatus.SCHEDULED) &&
          !isLiveNow;

        // Always show View Detail
        menuItems.push({
          key: "view-detail",
          icon: <EyeOutlined />,
          label: "View Detail",
          onClick: () => setDetailDrawer({ visible: true, auction: record }),
        });

        // Show Audit Logs
        menuItems.push({
          key: "audit-logs",
          icon: <HistoryOutlined />,
          label: "Audit Logs",
          onClick: () =>
            setAuditDrawer({
              visible: true,
              auctionId: record.id,
              auctionTitle: record.title,
            }),
        });

        // Show Edit only for editable statuses
        if (canEdit) {
          menuItems.push({
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => {
              setEditModal({ visible: true, auction: record });
            },
          });
        }

        // Show Cancel only for cancellable statuses
        if (canCancel) {
          menuItems.push({
            key: "cancel",
            icon: <StopOutlined />,
            label: "Cancel",
            danger: true,
            onClick: () => handleCancelClick(record),
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

      {/* Search Form with Manual Trigger */}
      <Form layout="vertical" className="mb-6 bg-zinc-900 p-4 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item label="Search">
            <Input
              placeholder="Search by Title, Description, Seller"
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

      {/* Tabs for Status Filter */}
      <div>
        <Tabs
          activeKey={status}
          onChange={(key) => {
            setStatus(key as AuctionStatus);
            setPage(1);
          }}
          items={[
            { label: "ALL", key: AuctionStatus.ALL },
            { label: "LIVE", key: AuctionStatus.LIVE },
            { label: "DRAFT", key: AuctionStatus.DRAFT },
            { label: "SCHEDULED", key: AuctionStatus.SCHEDULED },
            { label: "ENDED", key: AuctionStatus.ENDED },
            { label: "CANCELLED", key: AuctionStatus.CANCELLED },
          ]}
        />
      </div>

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

      {detailDrawer.visible && detailDrawer.auction && (
        <AuctionDetailDrawer
          key={detailDrawer.auction.id}
          auction={detailDrawer.auction}
          visible={detailDrawer.visible}
          onClose={() => setDetailDrawer({ visible: false })}
        />
      )}

      <AuctionAuditDrawer
        visible={auditDrawer.visible}
        auctionId={auditDrawer.auctionId || null}
        auctionTitle={auditDrawer.auctionTitle}
        onClose={() => setAuditDrawer({ visible: false })}
      />

      <CancelAuctionModal
        visible={cancelModal.visible}
        auctionId={cancelModal.auctionId}
        auctionTitle={cancelModal.auctionTitle}
        onCancel={() => setCancelModal({ visible: false })}
        onSuccess={() => {
          setCancelModal({ visible: false });
          refetch();
        }}
      />

      {/* Create Auction Modal */}
      <Modal
        title="Create Auction"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={700}
        centered
      >
        <AuctionForm
          form={form}
          mode="create"
          onSuccess={handleCreateSuccess}
          onCancel={() => setCreateModal(false)}
        />
      </Modal>

      {/* Edit Auction Modal */}
      {editModal.auction && (
        <Modal
          title={`Edit Auction #${editModal.auction.id}`}
          open={editModal.visible}
          onCancel={() => setEditModal({ visible: false })}
          footer={null}
          width={700}
          centered
        >
          <AuctionForm
            form={editForm}
            auction={editModal.auction}
            mode="edit"
            onSuccess={handleEditSuccess}
            onCancel={() => setEditModal({ visible: false })}
          />
        </Modal>
      )}
    </div>
  );
};
export default AdminAuctionPage;

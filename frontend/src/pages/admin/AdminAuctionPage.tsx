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
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import adminApi from "../../api/adminApi";
import {
  Auction,
  AuctionStatus,
  CancelAuctionRequest,
  PageResponse,
} from "../../api/types";
import CancelAuctionModal from "../../components/admin/CancelAuctionModal";
import AuctionForm from "../../features/auction/AuctionForm";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { convertUTCToLocal } from "../../utils/dateUtils";
import { formatDateTime } from "../../utils/format";
import { DEFAULT_AUCTION_IMAGE, getImageUrl } from "../../utils/imageUtils";
import { getStatusColor } from "../../utils/statusUtils";
import AuctionAuditDrawer from "./drawers/AuctionAuditDrawer";
import AuctionDetailDrawer from "./drawers/AuctionDetailDrawer";

const DEFAULT_IMAGE = DEFAULT_AUCTION_IMAGE;

const { RangePicker } = DatePicker;

const AdminAuctionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const { user } = useAuth();
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
  const status =
    (searchParams.get("status") as AuctionStatus) || AuctionStatus.LIVE;
  const setStatus = (s: AuctionStatus) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("status", s);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
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
  const [auditPage, setAuditPage] = useState(1);
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
      adminApi.filterAdminAuctions(
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
    setDateRange(null);
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    newParams.set("status", AuctionStatus.LIVE);
    setSearchParams(newParams);
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
          !isLiveNow &&
          record?.seller?.id === Number(user?.id);
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
          onClick: () => {
            setAuditPage(1);
            setAuditDrawer({
              visible: true,
              auctionId: record.id,
              auctionTitle: record.title,
            });
          },
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
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Auction Management
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModal(true)}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            border: "none",
            fontWeight: 700,
            height: "38px",
            borderRadius: "100px",
            padding: "0 20px",
            boxShadow:
              "0 0 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          Create Auction
        </Button>
      </div>

      {/* Search Form */}
      <div
        className="filter-container"
        style={{ animation: "fadeIn 0.35s ease-out" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Search by Title, Description, Seller"
              prefix={
                <SearchOutlined style={{ color: "rgba(255,255,255,0.3)" }} />
              }
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
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
              Date Range
            </div>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              showTime
              format="YYYY-MM-DD HH:mm"
              className="w-full"
            />
          </div>
        </div>
        <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
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
        </div>
      </div>

      {/* Tabs for Status Filter */}
      <div style={{ marginBottom: "4px" }}>
        <Tabs
          activeKey={status}
          onChange={(key) => {
            setStatus(key as AuctionStatus);
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
        page={auditPage}
        onPageChange={setAuditPage}
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

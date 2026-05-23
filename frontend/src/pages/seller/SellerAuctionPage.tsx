import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  HistoryOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  DatePicker,
  Dropdown,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import adminApi from "../../api/adminApi";
import { auctionApi } from "../../api/auctionApi";
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
import formatCurrency, { formatDateTime } from "../../utils/format";
import { DEFAULT_AUCTION_IMAGE, getImageUrl } from "../../utils/imageUtils";
import { getStatusColor } from "../../utils/statusUtils";
import AuctionDetailDrawer from "../admin/drawers/AuctionDetailDrawer";
import ShareAuctionModal from "../../features/auction/ShareAuctionModal";
import { ShareAltOutlined } from "@ant-design/icons";
import AuctionAuditDrawer from "../admin/drawers/AuctionAuditDrawer";

const DEFAULT_IMAGE = DEFAULT_AUCTION_IMAGE;

const { RangePicker } = DatePicker;

const SellerAuctionPage = () => {
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
  const status =
    (searchParams.get("status") as AuctionStatus) || AuctionStatus.LIVE;
  const setStatus = (s: AuctionStatus) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("status", s);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  const privateMode = searchParams.get("privateMode");
  const setPrivateMode = (mode: string | null | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (mode) newParams.set("privateMode", mode);
    else newParams.delete("privateMode");
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
  const [relistModal, setRelistModal] = useState<{
    visible: boolean;
    auctionId?: number;
  }>({ visible: false });
  const [shareModal, setShareModal] = useState<{
    visible: boolean;
    auction: Auction | null;
  }>({ visible: false, auction: null });
  const [liveAuctions, setLiveAuctions] = useState<Set<number>>(new Set());
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const queryClient = useQueryClient();

  // Debounce the keyword input (300ms delay)
  const debouncedKeyword = useDebounce(keyword, 300);

  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch auction detail if id is in the URL (Deep Linking support)
  const { data: detailAuction } = useQuery<Auction>({
    queryKey: ["auction-detail", urlId],
    queryFn: () => auctionApi.getAuctionDetail(Number(urlId)),
    enabled: !!urlId && !isNaN(Number(urlId)),
    retry: false,
  });

  // Automatically open drawer if we have a detail fetched from URL
  useEffect(() => {
    if (urlId && detailAuction) {
      setDetailDrawer({ visible: true, auction: detailAuction });
    }
  }, [urlId, detailAuction]);

  // Handle Close Drawer and clean URL
  const handleCloseDetail = () => {
    setDetailDrawer({ visible: false });
    // Navigate back to the list page without the ID parameter
    // Preserve current list search params (page, status, etc)
    const currentParams = searchParams.toString();
    navigate(`/seller/auctions${currentParams ? `?${currentParams}` : ""}`);
  };

  // Manual trigger for search - initial query with LIVE status
  const { data, isLoading, refetch } = useQuery<PageResponse<Auction>>({
    queryKey: [
      "seller-auctions",
      page,
      debouncedKeyword,
      status,
      dateRange,
      privateMode,
    ],
    queryFn: () =>
      adminApi.filterSellerAuctions(
        page,
        20,
        debouncedKeyword,
        status,
        dateRange?.[0]?.toISOString(),
        dateRange?.[1]?.toISOString(),
        privateMode ? privateMode === "true" : undefined,
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
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["seller-auctions"] });
      setCreateModal(false);
      form.resetFields();
      refetch();
    },
    onError: (error: any) => message.error(error.message),
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
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["seller-auctions"] });
      setEditModal({ visible: false });
      editForm.resetFields();
      refetch();
    },
    onError: (error: any) => message.error(error.message),
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: CancelAuctionRequest;
    }) => adminApi.cancelAuction(id, request),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["seller-auctions"] });
      setCancelModal({ visible: false });
      refetch();
    },
    onError: (error: any) => message.error(error.message),
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleClear = () => {
    setDateRange(null);
    setKeyword("");
    setPrivateMode(null);
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    newParams.set("status", AuctionStatus.LIVE);
    setSearchParams(newParams);
    queryClient.invalidateQueries({ queryKey: ["seller-auctions"] });
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
  const relistMutation = useMutation({
    mutationFn: auctionApi.relistAuction,
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["seller-auctions"] });
      setRelistModal({ visible: false });
      setStatus(AuctionStatus.DRAFT);
      navigate(`/seller/auctions?status=${AuctionStatus.DRAFT}`);
      refetch();
    },
    onError: (error: any) => message.error(error.message),
  });

  const handleRelist = (auctionId: number) => {
    setRelistModal({ visible: true, auctionId });
  };

  const columns = [
    {
      key: "actions",
      width: 10,
      render: (record: Auction) => {
        const menuItems = [];
        const isLiveNow = liveAuctions.has(record.id);
        const canEdit =
          (record.status === AuctionStatus.DRAFT ||
            record.status === AuctionStatus.SCHEDULED) &&
          !isLiveNow;
        const canCancel =
          (record.status === AuctionStatus.DRAFT ||
            record.status === AuctionStatus.SCHEDULED ||
            record.status === AuctionStatus.PENDING_REVIEW) &&
          !isLiveNow;

        // Always show View Detail
        menuItems.push({
          key: "view-detail",
          icon: <EyeOutlined />,
          label: "View Detail",
          onClick: () =>
            navigate(
              `/seller/auctions/${record.id}?${searchParams.toString()}`,
            ),
        });

        // Show Relist for ENDED_NO_SALE status
        if (record.status === AuctionStatus.ENDED_NO_SALE) {
          menuItems.push({
            key: "relist",
            icon: <ReloadOutlined />,
            label: "Relist",
            onClick: () => handleRelist(record.id),
          });
        }

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

        // Show Share for SCHEDULED or LIVE status
        if (
          record.status === AuctionStatus.SCHEDULED ||
          record.status === AuctionStatus.ENDED ||
          record.status === AuctionStatus.ENDED_NO_SALE ||
          record.status === AuctionStatus.LIVE
        ) {
          menuItems.push({
            key: "share",
            icon: <ShareAltOutlined />,
            label: "Share",
            onClick: () => setShareModal({ visible: true, auction: record }),
          });
        }

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
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="hover:text-[#FED469]"
            />
          </Dropdown>
        );
      },
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image: string) => (
        <Image
          src={getImageUrl(image)}
          style={{
            width: 64,
            height: 42,
            objectFit: "cover",
            borderRadius: 6,
            flexShrink: 0,
          }}
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
      title: "Price",
      dataIndex: "currentPrice",
      key: "currentPrice",
      render: (currentPrice: number) => (
        <span style={{ color: "#FED469" }}>{formatCurrency(currentPrice)}</span>
      ),
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
        <Tag color={getStatusColor(status)}>{status.replace(/_/g, " ")}</Tag>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight m-0">
          Auction Management
        </h1>
        <div className="flex items-center gap-2">
          {(keyword || dateRange || privateMode) && (
            <Button icon={<DeleteOutlined />} onClick={handleClear}>
              Clear All
            </Button>
          )}
          <Button
            icon={<FilterOutlined />}
            onClick={() => setIsFilterOpen((v) => !v)}
            type={isFilterOpen ? "primary" : "default"}
            className="flex items-center gap-1.5"
          >
            Filters
            {(keyword || dateRange || privateMode) && (
              <Badge
                count={[keyword, dateRange, privateMode].filter(Boolean).length}
                className="ml-1"
                styles={{
                  indicator: {
                    backgroundColor: "#FED469",
                    color: "#191B24",
                    fontSize: "11px",
                    fontWeight: 700,
                  },
                }}
              />
            )}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModal(true)}
          >
            Create Auction
          </Button>
        </div>
      </div>

      {/* Collapsible Filter */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isFilterOpen ? "grid-rows-[1fr] mb-6" : "grid-rows-[0fr] mb-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`filter-container !transition-opacity !duration-200 ${
              isFilterOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  Search
                </div>
                <Input
                  placeholder="Search by Title, Description"
                  prefix={<SearchOutlined className="text-white/30" />}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onPressEnter={handleSearch}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
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
              <div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  Mode
                </div>
                <Select
                  placeholder="Select Mode"
                  value={privateMode || undefined}
                  onChange={(value) => setPrivateMode(value || null)}
                  allowClear
                  style={{ width: "100%" }}
                  options={[
                    { label: "Public", value: "false" },
                    { label: "Private", value: "true" },
                  ]}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2.5">
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
            { label: "PENDING REVIEW", key: AuctionStatus.PENDING_REVIEW },
            { label: "SCHEDULED", key: AuctionStatus.SCHEDULED },
            { label: "ENDED", key: AuctionStatus.ENDED },
            { label: "ENDED NO SALE", key: AuctionStatus.ENDED_NO_SALE },
            { label: "CANCELLED", key: AuctionStatus.CANCELLED },
            { label: "REJECTED", key: AuctionStatus.REJECTED },
          ]}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: "max-content" }}
        pagination={{
          current: data?.currentPage,
          pageSize: data?.pageSize,
          total: data?.totalElements,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      {detailDrawer.visible && detailDrawer.auction && (
        <AuctionDetailDrawer
          key={detailDrawer.auction.id}
          auction={detailDrawer.auction}
          visible={detailDrawer.visible}
          onClose={handleCloseDetail}
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

      {/* Relist Auction Modal */}
      <Modal
        title="Relist Auction"
        open={relistModal.visible}
        onCancel={() => setRelistModal({ visible: false })}
        onOk={() =>
          relistModal.auctionId && relistMutation.mutate(relistModal.auctionId)
        }
        okText="Relist"
        cancelText="Cancel"
        confirmLoading={relistMutation.isPending}
        centered
      >
        <div className="py-4 text-white/80">
          Are you sure you want to relist this auction? It will be moved back to
          DRAFT status where you can manage it again.
        </div>
      </Modal>
      {/* Share Auction Modal */}
      <ShareAuctionModal
        visible={shareModal.visible}
        auction={shareModal.auction}
        onCancel={() => setShareModal({ visible: false, auction: null })}
      />
    </div>
  );
};
export default SellerAuctionPage;

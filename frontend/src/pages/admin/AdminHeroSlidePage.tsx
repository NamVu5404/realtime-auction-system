import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Empty,
  Image,
  Input,
  Modal,
  Spin,
  Switch,
  Table,
  Tag,
} from "antd";
import React, { useState } from "react";
import { extractErrorMessage } from "../../api/apiUtils";
import { auctionApi } from "../../api/auctionApi";
import { heroSlideApi } from "../../api/heroSlideApi";
import { Auction, HeroSlide } from "../../api/types";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../utils/format";
import { DEFAULT_AUCTION_IMAGE, getImageUrl } from "../../utils/imageUtils";

const STATUS_COLOR: Record<string, string> = {
  LIVE: "red",
  SCHEDULED: "blue",
  ENDED: "default",
  PENDING_REVIEW: "orange",
  DRAFT: "default",
  CANCELLED: "default",
  REJECTED: "error",
  ENDED_NO_SALE: "default",
};

const AdminHeroSlidePage: React.FC = () => {
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["admin-hero-slides"],
    queryFn: heroSlideApi.getAdminHeroSlides,
  });

  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ["auction-search-for-hero", debouncedSearch],
    queryFn: () => auctionApi.searchAuctions(debouncedSearch, 1, 20),
    enabled: debouncedSearch.length > 0,
    select: (data) => data.data ?? [],
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });

  const addMutation = useMutation({
    mutationFn: (auctionId: number) => heroSlideApi.addHeroSlide(auctionId),
    onSuccess: (data) => {
      message.success(data.message);
      invalidate();
      setAddModalOpen(false);
      setSearchInput("");
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: heroSlideApi.removeHeroSlide,
    onSuccess: (msg) => {
      message.success(msg);
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: number[]) =>
      heroSlideApi.reorderHeroSlides(orderedIds),
    onSuccess: () => invalidate(),
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: heroSlideApi.toggleActive,
    onSuccess: () => invalidate(),
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newSlides = [...slides].sort((a, b) => a.position - b.position);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSlides.length) return;
    [newSlides[index], newSlides[swapIndex]] = [
      newSlides[swapIndex],
      newSlides[index],
    ];
    reorderMutation.mutate(newSlides.map((s) => s.id));
  };

  const existingAuctionIds = new Set(slides.map((s) => s.auctionId));
  const sortedSlides = [...slides].sort((a, b) => a.position - b.position);

  const columns = [
    {
      title: "Order",
      width: 60,
      render: (_: unknown, record: HeroSlide, index: number) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Button
            icon={<ArrowUpOutlined />}
            size="small"
            type="text"
            disabled={index === 0 || reorderMutation.isPending}
            onClick={() => moveSlide(index, "up")}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {index + 1}
          </span>
          <Button
            icon={<ArrowDownOutlined />}
            size="small"
            type="text"
            disabled={
              index === sortedSlides.length - 1 || reorderMutation.isPending
            }
            onClick={() => moveSlide(index, "down")}
          />
        </div>
      ),
    },
    {
      title: "Auction",
      render: (_: unknown, record: HeroSlide) => {
        const imgSrc = record.auctionImage
          ? getImageUrl(record.auctionImage)
          : DEFAULT_AUCTION_IMAGE;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image
              src={imgSrc}
              alt={record.auctionTitle}
              fallback={DEFAULT_AUCTION_IMAGE}
              style={{
                width: 64,
                height: 42,
                objectFit: "cover",
                borderRadius: 6,
                flexShrink: 0,
              }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#fff",
                }}
              >
                {record.auctionTitle}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                ID #{record.auctionId}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      width: 130,
      render: (_: unknown, record: HeroSlide) => (
        <Tag color={STATUS_COLOR[record.auctionStatus] ?? "default"}>
          {record.auctionStatus}
        </Tag>
      ),
    },
    {
      title: "Visible",
      width: 90,
      render: (_: unknown, record: HeroSlide) => (
        <Switch
          checked={record.active}
          loading={toggleMutation.isPending}
          onChange={() => toggleMutation.mutate(record.id)}
          checkedChildren={<EyeOutlined />}
          unCheckedChildren={<EyeInvisibleOutlined />}
        />
      ),
    },
    {
      title: "",
      width: 60,
      render: (_: unknown, record: HeroSlide) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          type="text"
          size="small"
          loading={removeMutation.isPending}
          onClick={() => {
            modal.confirm({
              title: "Remove Hero Slide",
              content: `Remove "${record.auctionTitle}" from hero slides?`,
              okText: "Remove",
              cancelText: "Cancel",
              onOk: () => removeMutation.mutate(record.id),
            });
          }}
        />
      ),
    },
  ];

  const searchColumns = [
    {
      title: "Auction",
      render: (_: unknown, record: Auction) => {
        const imgSrc = record.image
          ? getImageUrl(record.image)
          : DEFAULT_AUCTION_IMAGE;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={imgSrc}
              alt={record.title}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
              }}
              style={{
                width: 52,
                height: 34,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
                {record.title}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {formatCurrency(record.currentPrice)} ·{" "}
                <Tag
                  color={STATUS_COLOR[record.status] ?? "default"}
                  style={{ margin: 0 }}
                >
                  {record.status}
                </Tag>
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "",
      width: 80,
      render: (_: unknown, record: Auction) => {
        const alreadyAdded = existingAuctionIds.has(record.id);
        return (
          <Button
            type="primary"
            size="small"
            disabled={alreadyAdded}
            loading={addMutation.isPending}
            onClick={() => addMutation.mutate(record.id)}
          >
            {alreadyAdded ? "Added" : "Add"}
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Hero Slide Management
          </h1>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
        >
          Add Auction
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : sortedSlides.length === 0 ? (
        <Empty description="No hero slides yet. Add an auction to get started." />
      ) : (
        <Table
          dataSource={sortedSlides}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          rowClassName={(record) => (!record.active ? "opacity-40" : "")}
        />
      )}

      <Modal
        title="Add Auction to Hero Slide"
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          setSearchInput("");
        }}
        footer={null}
        width={640}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search auctions by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            allowClear
          />
        </div>

        {debouncedSearch === "" ? (
          <Empty description="Type to search for an auction" />
        ) : searching ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <Spin />
          </div>
        ) : searchResults.length === 0 ? (
          <Empty description="No auctions found" />
        ) : (
          <Table
            dataSource={searchResults}
            columns={searchColumns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 360 }}
          />
        )}
      </Modal>
    </div>
  );
};

export default AdminHeroSlidePage;

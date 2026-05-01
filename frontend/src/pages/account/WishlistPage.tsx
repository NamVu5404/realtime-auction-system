import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Spin, Typography } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { wishlistApi } from "../../api/wishlistApi";
import { PageResponse, WishListResponse, Auction } from "../../api/types";
import AuctionList from "../../features/auction/AuctionList";
import { useAuthStore } from "../../store/useAuthStore";

const { Title } = Typography;

const mapWishListToAuction = (wishlistItem: WishListResponse): Auction => {
  return {
    id: wishlistItem.auctionId,
    title: wishlistItem.title,
    description: "", // Not returned in wishlist response
    image: wishlistItem.image,
    startPrice: wishlistItem.startPrice,
    currentPrice: wishlistItem.currentPrice,
    minStep: 0, // Not needed for card display
    status: wishlistItem.status,
    startTime: wishlistItem.startTime,
    endTime: wishlistItem.endTime,
    antiSnipeSeconds: 0,
    extensionSeconds: 0,
    privateMode: wishlistItem.privateMode,
    seller: {
      id: 0,
      email: "",
      name: wishlistItem.sellerName || "Unknown",
      roles: [],
    },
    createdAt: wishlistItem.createdAt,
  };
};

const WishlistPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery<PageResponse<WishListResponse>, Error>({
    queryKey: ["wishlist", page],
    queryFn: () => wishlistApi.getMyWishList(page, 12),
    enabled: isAuthenticated,
  });

  const handlePageChange = (p: number) => {
    setSearchParams({ page: p.toString() });
  };

  if (!isAuthenticated) {
    return (
      <div className="account-wrapper">
        <Empty description="Please login to view your wishlist" />
      </div>
    );
  }

  const mappedAuctions = data?.data.map(mapWishListToAuction) || [];

  return (
    <div className="account-wrapper">
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "24px", fontSize: "24px" }}
      >
        My Wishlist
      </Title>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      ) : mappedAuctions.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: "rgba(255,255,255,0.45)" }}>
              Your wishlist is empty
            </span>
          }
        >
          <Button
            type="primary"
            onClick={() => navigate("/")}
            style={{ padding: "0 24px" }}
            size="large"
          >
            Browse Auctions
          </Button>
        </Empty>
      ) : (
        <AuctionList
          auctions={mappedAuctions}
          currentPage={page}
          pageSize={data?.pageSize || 20}
          totalElements={data?.totalElements || 0}
          onPageChange={handlePageChange}
          emptyMessage="Your wishlist is empty"
          gridSpan={{ xs: 12, sm: 12, md: 8, lg: 8, xl: 6 }}
        />
      )}
    </div>
  );
};

export default WishlistPage;

import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";
import { useWishlist } from "../../hooks/useWishlist";
import { useAuthStore } from "../../store/useAuthStore";

interface WishlistButtonProps {
  auctionId: number;
  isWishListed?: boolean;
  size?: "small" | "middle" | "large";
  type?: "default" | "primary" | "text" | "link" | "dashed";
  className?: string;
  style?: React.CSSProperties;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  auctionId,
  isWishListed = false,
  size = "middle",
  type = "text",
  className,
  style,
}) => {
  const { toggleWishlist, isLoading } = useWishlist(auctionId, isWishListed);
  const { isAuthenticated } = useAuthStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWishlist();
  };

  if (!isAuthenticated) return null;

  return (
    <Button
      type={type}
      size={size}
      icon={
        isWishListed ? (
          <HeartFilled style={{ color: "#F43F5E" }} />
        ) : (
          <HeartOutlined style={{ color: "rgba(255, 255, 255, 0.85)" }} />
        )
      }
      onClick={handleClick}
      loading={isLoading}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    />
  );
};

export default WishlistButton;

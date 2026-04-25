import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { wishlistApi } from "../api/wishlistApi";
import { useAuthStore } from "../store/useAuthStore";
import { useMemo } from "react";

export const useWishlistBatch = (auctionIds: number[]) => {
  const { isAuthenticated } = useAuthStore();

  const { data: wishlistedIds = [], isLoading: isChecking } = useQuery({
    queryKey: ["wishlist-batch", auctionIds],
    queryFn: () => wishlistApi.checkBatch(auctionIds),
    enabled: isAuthenticated && auctionIds.length > 0,
    staleTime: 30000, // Cache for 30s
  });

  const wishlistedSet = useMemo(() => new Set(wishlistedIds), [wishlistedIds]);

  return { wishlistedSet, isChecking };
};

export const useWishlist = (auctionId?: number, isWishListed: boolean = false) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { isAuthenticated } = useAuthStore();

  const addMutation = useMutation({
    mutationFn: () => wishlistApi.addToWishList(auctionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-batch"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      message.success("Added to wishlist");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to add to wishlist");
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => wishlistApi.removeFromWishList(auctionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-batch"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      message.success("Removed from wishlist");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to remove from wishlist");
    },
  });

  const toggleWishlist = () => {
    if (!isAuthenticated) {
      message.warning("Please login to use the wishlist feature");
      return;
    }
    if (isWishListed) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return {
    toggleWishlist,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
};

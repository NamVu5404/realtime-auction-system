import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { auctionApi } from "../api/auctionApi";
import {
  Auction,
  AuctionStatus,
  PaginatedAuctions,
  PageResponse,
  AuctionHistoryResponse,
} from "../api/types";

/**
 * Hook for fetching paginated auctions by status
 *
 * Features:
 * - Automatic handling of pagination (converts frontend 1-indexed to backend 0-indexed)
 * - Optimized with keepPreviousData to prevent flickering on tab switches
 * - 5-second stale time to reduce unnecessary re-fetches
 * - Automatic refetching on status/page/size changes
 *
 * @param status - Auction status filter: LIVE, SCHEDULED, ENDED
 * @param page - Current page (1-indexed, frontend convention)
 * @param size - Items per page (default: 20)
 * @returns useQuery result with paginated auctions
 *
 * @example
 * const { data, isLoading, error } = useAuctions(AuctionStatus.LIVE, 1, 20);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {data?.data.map(auction => (
 *       <AuctionCard key={auction.id} auction={auction} />
 *     ))}
 *     <Pagination
 *       current={data?.currentPage}
 *       total={data?.totalElements}
 *       pageSize={data?.pageSize}
 *     />
 *   </div>
 * );
 */
export const useAuctions = (
  status: AuctionStatus,
  page: number = 1,
  size: number = 20,
): UseQueryResult<PaginatedAuctions, Error> => {
  return useQuery({
    // Unique query key based on parameters
    queryKey: ["auctions", status, page, size],

    // Query function
    queryFn: () => auctionApi.getAuctionsByStatus(status, page, size),

    // Optimization settings
    staleTime: 5000, // Consider data fresh for 5 seconds
    gcTime: 10 * 60 * 1000, // Keep cache for 10 minutes (formerly cacheTime)

    // Keep previous data while fetching new data (prevents flickering)
    // when switching tabs or pages
    placeholderData: (previousData) => previousData,

    // Automatically refetch on window focus
    refetchOnWindowFocus: false,

    // Retry on error (up to 2 times)
    retry: 2,
  });
};

/**
 * Hook for fetching a single auction detail
 *
 * @param auctionId - Auction ID to fetch
 * @param enabled - Whether to fetch (defaults to true)
 * @returns useQuery result with auction details
 *
 * @example
 * const { data: auction, isLoading } = useAuctionDetail(id, !!id);
 */
export const useAuctionDetail = (
  auctionId: number | null,
  enabled: boolean = true,
): UseQueryResult<Auction, Error> => {
  return useQuery({
    queryKey: ["auction", auctionId],
    queryFn: () => {
      if (!auctionId) throw new Error("Auction ID is required");
      return auctionApi.getAuctionDetail(auctionId);
    },
    staleTime: 10000, // 10 seconds for detail page
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && auctionId !== null,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * Hook for fetching auction history (bid logs)
 *
 * @param auctionId - Auction ID
 * @param page - Page number
 * @param size - Items per page
 * @param enabled - Whether to fetch
 * @returns useQuery result with paginated auction history
 */
export const useAuctionHistory = (
  auctionId: number | null,
  page: number = 1,
  size: number = 20,
  enabled: boolean = true,
): UseQueryResult<PageResponse<AuctionHistoryResponse>, Error> => {
  return useQuery({
    queryKey: ["auction", auctionId, "history", page, size],
    queryFn: () => {
      if (!auctionId) throw new Error("Auction ID is required");
      return auctionApi.getAuctionHistory(auctionId, page, size);
    },
    staleTime: 5000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    enabled: enabled && auctionId !== null,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

package com.namvu.realtimeauctionsystem.modules.bid.service;

import com.namvu.realtimeauctionsystem.modules.bid.dto.BidProjection;
import com.namvu.realtimeauctionsystem.modules.bid.dto.MostActiveAuctionData;
import com.namvu.realtimeauctionsystem.modules.bid.dto.RecentBidFeedResponse;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

/**
 * Read-only bid queries, tách ra để tránh circular dependency:
 * AuctionService → BidService → AuctionService
 */
public interface BidQueryService {
    Page<Bid> getPagedBidsByAuction(Long auctionId, Pageable pageable);

    Long countTotalBidsReceivedBySeller(Long sellerId);
    
    Long countUniqueBiddersBySeller(Long sellerId);

    long countAllBids();

    List<BidProjection> getAdminBidChartData(Instant startDate, String timeFormat);

    List<MostActiveAuctionData> getMostActiveAuctions(int limit);

    List<RecentBidFeedResponse> getRecentPublicBids(int limit);
}

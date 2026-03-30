package com.namvu.realtimeauctionsystem.modules.bid.service;

import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Read-only bid queries, tách ra để tránh circular dependency:
 * AuctionService → BidService → AuctionService
 */
public interface BidQueryService {
    Page<Bid> getPagedBidsByAuction(Long auctionId, Pageable pageable);
}

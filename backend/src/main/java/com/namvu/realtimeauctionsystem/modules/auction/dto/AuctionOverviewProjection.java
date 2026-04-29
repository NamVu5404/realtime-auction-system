package com.namvu.realtimeauctionsystem.modules.auction.dto;

public interface AuctionOverviewProjection {
    Long getTotalAuctions();
    Long getLiveCount();
    Long getScheduledCount();
    Long getPendingReviewCount();
    Long getRejectedCount();
    Long getEndedCount();
    Long getEndedNoSaleCount();
    Long getCancelledCount();
    Long getDraftCount();
    Long getPublicCount();
    Long getPrivateCount();
    Long getEndedWithHighestBidder();
}

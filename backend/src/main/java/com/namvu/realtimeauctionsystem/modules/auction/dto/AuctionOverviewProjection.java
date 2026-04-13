package com.namvu.realtimeauctionsystem.modules.auction.dto;

public interface AuctionOverviewProjection {
    Long getTotalAuctions();
    Long getLiveCount();
    Long getScheduledCount();
    Long getEndedCount();
    Long getCancelledCount();
    Long getDraftCount();
    Long getEndedWithHighestBidder();
}

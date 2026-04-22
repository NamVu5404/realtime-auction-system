package com.namvu.realtimeauctionsystem.modules.auction.dto;

import java.math.BigDecimal;

public interface SellerAggregateProjection {
    Long getTotalAuctionsCreated();
    Long getTotalAuctionsSold();
    Long getActiveAuctions();
    Long getEndedAuctions();
    BigDecimal getTotalRevenue();
    BigDecimal getHighestSoldPrice();
}

package com.namvu.realtimeauctionsystem.modules.auction.dto;

import java.math.BigDecimal;

public interface KpiAuctionProjection {
    BigDecimal getTotalPlatformRevenue();
    Long getLiveAuctions();
}

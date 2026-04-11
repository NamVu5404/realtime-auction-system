package com.namvu.realtimeauctionsystem.modules.auction.dto;

import java.math.BigDecimal;

public interface SellerChartProjection {
    String getPeriodLabel();

    Long getAuctionsCompleted();

    BigDecimal getRevenue();
}

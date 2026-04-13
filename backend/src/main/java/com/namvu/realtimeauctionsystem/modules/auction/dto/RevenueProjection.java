package com.namvu.realtimeauctionsystem.modules.auction.dto;

import java.math.BigDecimal;

public interface RevenueProjection {
    String getPeriodLabel();
    BigDecimal getRevenue();
}

package com.namvu.realtimeauctionsystem.modules.user.dto;

import java.math.BigDecimal;

public interface TopSellerProjection {
    Long getSellerId();
    String getSellerName();
    String getSellerEmail();
    String getAvatarUrl();
    BigDecimal getTotalRevenue();
    Long getAuctionCount();
}

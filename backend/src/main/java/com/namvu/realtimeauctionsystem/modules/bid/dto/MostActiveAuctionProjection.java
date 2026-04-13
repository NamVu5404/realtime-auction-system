package com.namvu.realtimeauctionsystem.modules.bid.dto;

import java.math.BigDecimal;

public interface MostActiveAuctionProjection {
    Long getAuctionId();
    String getTitle();
    Long getBidCount();
    BigDecimal getCurrentPrice();
    String getStatus();
}

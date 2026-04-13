package com.namvu.realtimeauctionsystem.modules.auction.dto;

import java.math.BigDecimal;

public interface AuctionWinProjection {
    Long getTotalWins();
    BigDecimal getHighestWinningBid();
    BigDecimal getTotalSpent();
    Long getActiveLeading();
}

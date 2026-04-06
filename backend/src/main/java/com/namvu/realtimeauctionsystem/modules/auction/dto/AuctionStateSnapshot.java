package com.namvu.realtimeauctionsystem.modules.auction.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class AuctionStateSnapshot {
    private BigDecimal currentPrice;
    private Long highestBidderId;
    private String highestBidderName;
    private String highestBidderEmail;
    private Instant endTime;
}

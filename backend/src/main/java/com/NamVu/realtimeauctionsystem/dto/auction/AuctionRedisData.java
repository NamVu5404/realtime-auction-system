package com.namvu.realtimeauctionsystem.dto.auction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionRedisData {
    private Long auctionId;
    private BigDecimal currentPrice;
    private Long highestBidderId;
    private Long sellerId;
    private Integer bidCount;
    private Instant lastBidTime;
    private Instant endTime;
    private String status;
}

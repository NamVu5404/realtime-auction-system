package com.namvu.realtimeauctionsystem.dto.bid;

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
public class BidUpdateMessage {
    private Long auctionId;
    private BigDecimal currentPrice;
    private Long highestBidderId;
    private String highestBidderName;
    private Integer bidCount;
    private boolean extended;
    private Instant timestamp;
}

package com.namvu.realtimeauctionsystem.modules.bid.dto;

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
public class BidFailureMessage {
    private Long auctionId;
    private Long bidderId;
    private BigDecimal amount;
    private String reason;
    private Instant timestamp;
}

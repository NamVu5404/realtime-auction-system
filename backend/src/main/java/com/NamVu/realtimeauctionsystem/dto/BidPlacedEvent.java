package com.NamVu.realtimeauctionsystem.dto;

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
public class BidPlacedEvent {
    private Long auctionId;
    private Long bidderId;
    private BigDecimal amount;
    private Instant timestamp;
    private boolean extended;
}

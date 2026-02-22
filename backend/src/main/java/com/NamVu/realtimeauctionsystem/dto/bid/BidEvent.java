package com.NamVu.realtimeauctionsystem.dto.bid;

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
public class BidEvent {
    private Long auctionId;
    private Long bidderId;
    private String bidderName;
    private BigDecimal amount;
    private boolean extended;
    private Instant finalEndTime;
    private Long timestamp;
}

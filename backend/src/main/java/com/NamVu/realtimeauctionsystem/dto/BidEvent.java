package com.NamVu.realtimeauctionsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
    private Long timestamp;
}

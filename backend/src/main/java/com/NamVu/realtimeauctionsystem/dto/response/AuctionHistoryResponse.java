package com.NamVu.realtimeauctionsystem.dto.response;

import com.NamVu.realtimeauctionsystem.enums.BidStatus;
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
public class AuctionHistoryResponse {
    private Long bidderId;
    private String bidderEmail;
    private BigDecimal amount;
    private Instant timestamp;
    private BidStatus status;
}

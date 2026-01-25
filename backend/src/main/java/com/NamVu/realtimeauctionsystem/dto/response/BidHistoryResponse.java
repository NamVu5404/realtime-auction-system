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
public class BidHistoryResponse {
    private Long id;
    private Long auctionId;
    private UserResponse bidder;
    private BigDecimal amount;
    private BidStatus status;
    private Instant createdAt;
}

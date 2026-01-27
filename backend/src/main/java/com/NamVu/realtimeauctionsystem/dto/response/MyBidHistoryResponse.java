package com.NamVu.realtimeauctionsystem.dto.response;

import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
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
public class MyBidHistoryResponse {
    private Long auctionId;
    private String auctionTitle;
    private AuctionStatus auctionStatus;
    private BigDecimal currentPrice;
    private BigDecimal amount;
    private BidStatus status;
    private Instant createdAt;
}

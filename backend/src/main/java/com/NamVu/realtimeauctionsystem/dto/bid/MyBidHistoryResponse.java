package com.namvu.realtimeauctionsystem.dto.bid;

import com.namvu.realtimeauctionsystem.enums.AuctionStatus;
import com.namvu.realtimeauctionsystem.enums.BidStatus;
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
    private BigDecimal currentPrice; // auction
    private BigDecimal amount; // bidder
    private BidStatus status;
    private Instant createdAt;
}

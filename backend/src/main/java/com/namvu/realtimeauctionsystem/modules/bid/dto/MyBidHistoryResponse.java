package com.namvu.realtimeauctionsystem.modules.bid.dto;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.constant.BidStatus;
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

package com.namvu.realtimeauctionsystem.modules.bid.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentBidFeedResponse {
    private String bidderName;
    private String bidderAvatarUrl;
    private String auctionTitle;
    private Long auctionId;
    private BigDecimal amount;
    private Instant createdAt;
}

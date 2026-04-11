package com.namvu.realtimeauctionsystem.modules.bid.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class MyBidStatsResponse {
    private Long totalAuctionsParticipated;
    private Long totalWins;
    private Long totalBids;
    private BigDecimal highestWinningBid;
    private BigDecimal totalSpent;
    private Long activeLeading;
    private List<BidChartProjection> activityChart;
}

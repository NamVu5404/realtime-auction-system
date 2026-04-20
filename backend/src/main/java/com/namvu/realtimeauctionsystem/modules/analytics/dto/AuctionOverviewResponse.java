package com.namvu.realtimeauctionsystem.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionOverviewResponse {
    private Long totalAuctions;
    private Long liveCount;
    private Long scheduledCount;
    private Long endedCount;
    private Long endedNoSaleCount;
    private Long cancelledCount;
    private Long draftCount;
    private Double successRate;
    private Long totalBidsAllTime;
    private Double avgBidsPerAuction;
}

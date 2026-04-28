package com.namvu.realtimeauctionsystem.modules.auction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerStatsResponse {
    private BigDecimal totalRevenue;
    private Long totalAuctionsCreated;
    private Long totalAuctionsSold;
    private Long totalAuctionsEnded;
    private Long activeAuctions;
    private Long pendingReviewCount;
    private Long rejectedCount;
    private Long totalBidsReceived;
    private BigDecimal highestSoldPrice;
    private Long totalUniqueBidders;
    private List<SellerChartProjection> revenueChart;
}

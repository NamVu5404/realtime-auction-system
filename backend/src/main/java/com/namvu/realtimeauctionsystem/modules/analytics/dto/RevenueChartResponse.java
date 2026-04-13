package com.namvu.realtimeauctionsystem.modules.analytics.dto;

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
public class RevenueChartResponse {
    private BigDecimal totalRevenue;
    private Long totalBids;
    private List<AdminChartPoint> chartData;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminChartPoint {
        private String periodLabel;
        private BigDecimal revenue;
        private Long bidCount;
    }
}

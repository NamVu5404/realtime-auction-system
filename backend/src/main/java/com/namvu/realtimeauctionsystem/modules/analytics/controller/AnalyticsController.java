package com.namvu.realtimeauctionsystem.modules.analytics.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.AuctionOverviewResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.KpiResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.RevenueChartResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.TopPerformingResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.UserAnalyticsResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/admin/dashboard/kpis")
    public ApiResponse<KpiResponse> getAdminKpis() {
        return ApiResponse.ok(analyticsService.getAdminKpis());
    }

    @GetMapping("/admin/dashboard/auction-overview")
    public ApiResponse<AuctionOverviewResponse> getAdminAuctionOverview() {
        return ApiResponse.ok(analyticsService.getAdminAuctionOverview());
    }

    @GetMapping("/admin/dashboard/user-analytics")
    public ApiResponse<UserAnalyticsResponse> getUserAnalytics() {
        return ApiResponse.ok(analyticsService.getAdminUserAnalytics());
    }

    @GetMapping("/admin/dashboard/revenue-chart")
    public ApiResponse<RevenueChartResponse> getAdminRevenueChart(
            @RequestParam(defaultValue = "MONTH") String period
    ) {
        return ApiResponse.ok(analyticsService.getAdminRevenueChart(period));
    }

    @GetMapping("/admin/dashboard/top-performers")
    public ApiResponse<TopPerformingResponse> getTopPerformers() {
        return ApiResponse.ok(analyticsService.getTopPerformers());
    }
}

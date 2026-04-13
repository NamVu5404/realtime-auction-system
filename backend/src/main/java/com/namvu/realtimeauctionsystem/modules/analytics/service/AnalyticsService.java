package com.namvu.realtimeauctionsystem.modules.analytics.service;

import com.namvu.realtimeauctionsystem.modules.analytics.dto.AuctionOverviewResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.KpiResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.RevenueChartResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.TopPerformingResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.UserAnalyticsResponse;

public interface AnalyticsService {
    KpiResponse getAdminKpis();

    AuctionOverviewResponse getAdminAuctionOverview();

    UserAnalyticsResponse getAdminUserAnalytics();

    RevenueChartResponse getAdminRevenueChart(String period);

    TopPerformingResponse getTopPerformers();
}

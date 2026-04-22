package com.namvu.realtimeauctionsystem.modules.analytics.service.impl;

import com.namvu.realtimeauctionsystem.modules.analytics.dto.AuctionOverviewResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.KpiResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.RevenueChartResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.TopPerformingResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.dto.UserAnalyticsResponse;
import com.namvu.realtimeauctionsystem.modules.analytics.service.AnalyticsService;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionOverviewProjection;
import com.namvu.realtimeauctionsystem.modules.auction.dto.KpiAuctionProjection;
import com.namvu.realtimeauctionsystem.modules.auction.dto.RevenueProjection;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidProjection;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidQueryService;
import com.namvu.realtimeauctionsystem.modules.contact.service.ContactService;
import com.namvu.realtimeauctionsystem.modules.seller_registration.service.SellerRegService;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AuctionService auctionService;
    private final UserService userService;
    private final ContactService contactService;
    private final SellerRegService sellerRegService;
    private final BidQueryService bidQueryService;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public KpiResponse getAdminKpis() {
        KpiAuctionProjection auctionKpis = auctionService.getAdminKpiAuctionData();

        return KpiResponse.builder()
                .totalPlatformRevenue(auctionKpis.getTotalPlatformRevenue())
                .liveAuctions(auctionKpis.getLiveAuctions())
                .totalUsers(userService.countAllUsers())
                .totalSellers(userService.countSellers())
                .pendingSellerRequests(sellerRegService.getPendingRegistrations())
                .pendingContacts(contactService.countPending())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public AuctionOverviewResponse getAdminAuctionOverview() {
        AuctionOverviewProjection data = auctionService.getAdminAuctionOverviewData();
        long totalBids = bidQueryService.countAllBids();
        
        double successRate = (data.getEndedCount() + data.getEndedNoSaleCount()) > 0
                ? (data.getEndedWithHighestBidder().doubleValue() / (data.getEndedCount() + data.getEndedNoSaleCount())) * 100
                : 0.0;
                
        double avgBidsPerAuction = data.getLiveCount() + data.getEndedCount() + data.getEndedNoSaleCount() > 0
                ? (double) totalBids / (data.getLiveCount() + data.getEndedCount() + data.getEndedNoSaleCount())
                : 0.0;

        return AuctionOverviewResponse.builder()
                .totalAuctions(data.getTotalAuctions())
                .liveCount(data.getLiveCount())
                .scheduledCount(data.getScheduledCount())
                .endedCount(data.getEndedCount())
                .endedNoSaleCount(data.getEndedNoSaleCount())
                .cancelledCount(data.getCancelledCount())
                .draftCount(data.getDraftCount())
                .successRate(successRate)
                .totalBidsAllTime(totalBids)
                .avgBidsPerAuction(avgBidsPerAuction)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public UserAnalyticsResponse getAdminUserAnalytics() {
        return userService.getUserAnalytics();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public RevenueChartResponse getAdminRevenueChart(String period) {
        String timeFormat = "WEEK".equalsIgnoreCase(period) ? "%x-W%v" : "%Y-%m";
        Instant startDate = "WEEK".equalsIgnoreCase(period)
                ? Instant.now().minus(30 * 3L, ChronoUnit.DAYS)
                : Instant.now().minus(365, ChronoUnit.DAYS);

        List<RevenueProjection> revenueProjections = auctionService.getAdminRevenueChartData(startDate, timeFormat);
        List<BidProjection> bidProjections = bidQueryService.getAdminBidChartData(startDate, timeFormat);

        Map<String, RevenueChartResponse.AdminChartPoint> chartMap = new HashMap<>();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalBids = 0;

        for (RevenueProjection rev : revenueProjections) {
            RevenueChartResponse.AdminChartPoint point = chartMap.computeIfAbsent(rev.getPeriodLabel(),
                    k -> RevenueChartResponse.AdminChartPoint.builder()
                            .periodLabel(k)
                            .revenue(BigDecimal.ZERO)
                            .bidCount(0L)
                            .build());
            point.setRevenue(rev.getRevenue());
            totalRevenue = totalRevenue.add(rev.getRevenue());
        }

        for (BidProjection bid : bidProjections) {
            RevenueChartResponse.AdminChartPoint point = chartMap.computeIfAbsent(bid.getPeriodLabel(),
                    k -> RevenueChartResponse.AdminChartPoint.builder()
                            .periodLabel(k)
                            .revenue(BigDecimal.ZERO)
                            .bidCount(0L)
                            .build());
            point.setBidCount(bid.getBidCount());
            totalBids += bid.getBidCount();
        }

        List<RevenueChartResponse.AdminChartPoint> chartData = chartMap.values().stream()
                .sorted(Comparator.comparing(RevenueChartResponse.AdminChartPoint::getPeriodLabel))
                .toList();

        return RevenueChartResponse.builder()
                .totalRevenue(totalRevenue)
                .totalBids(totalBids)
                .chartData(chartData)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public TopPerformingResponse getTopPerformers() {
        return TopPerformingResponse.builder()
                .topSellers(userService.getTopSellers(5))
                .mostActiveAuctions(bidQueryService.getMostActiveAuctions(5))
                .build();
    }
}

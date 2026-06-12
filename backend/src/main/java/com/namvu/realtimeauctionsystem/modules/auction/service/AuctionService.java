package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.common.constant.AiReviewDecision;
import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.auction.dto.*;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidRequestV1;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface AuctionService {
    PageResponse<AuctionResponse> filterAuctionForUser(String q, AuctionStatus status, Pageable pageable);

    PageResponse<AuctionResponse> getPublicAuctionsBySeller(Long sellerId, Pageable pageable);

    AuctionResponse getAuctionDetail(Long id, String token);

    AuctionResponse saveDraft(CreateAuctionRequest request);

    AuctionResponse scheduleAuction(CreateAuctionRequest request);

    AuctionResponse updateDraftAuction(Long id, UpdateDraftAuctionRequest request);

    AuctionResponse updateScheduledAuction(Long id, UpdateScheduledAuctionRequest request);

    AuctionResponse relistAuction(Long auctionId);

    CancelAuctionResponse cancelAuction(Long id, CancelAuctionRequest request);

    PlaceBidResponse placeBidV1(PlaceBidRequestV1 request);

    PageResponse<AuctionResponse> filterSellerAuction(String keyword, Instant startTime, Instant endTime,
                                                      AuctionStatus status, Boolean privateMode, Pageable pageable);

    PageResponse<AuctionResponse> filterAdminAuction(String keyword, Instant startTime, Instant endTime,
                                                     AuctionStatus status, Boolean privateMode, Pageable pageable);

    PageResponse<AuctionHistoryResponse> getAuctionHistory(Long id, Pageable pageable);

    int applyBid(Long auctionId, BigDecimal newPrice, Long bidderId, Instant finalEndTime, Integer nextExtensionCount);

    void cancelFutureAuctions(Long userId);

    Auction getAuctionDetailById(Long id);

    Auction saveAuction(Auction auction);

    void isLiveAuction(Long auctionId);

    Auction getAuctionReference(Long auctionId);

    AuctionStateSnapshot getAuctionState(Long auctionId);

    AuctionWinProjection getAuctionWinMetrics(Long bidderId);

    SellerStatsResponse getSellerStats(Long sellerId, String period);

    KpiAuctionProjection getAdminKpiAuctionData();

    AuctionOverviewProjection getAdminAuctionOverviewData();

    List<RevenueProjection> getAdminRevenueChartData(Instant startDate, String timeFormat);

    String getAuctionToken(Long id);

    List<AuctionResponse> getMyRecentBidAuctions(int limit);

    PageResponse<AuctionResponse> getMyParticipatedAuctions(int page, int size);

    List<AuctionResponse> getTrendingAuctions(int limit);

    List<AuctionResponse> getMostWishlistedAuctions(int limit);

    AuctionResponse approveAuction(Long auctionId);

    AuctionResponse rejectAuction(Long auctionId, String reason);

    void handleAiReviewResult(Long auctionId, AiReviewDecision decision, String reasons, String model);

    long countPendingReviewAuctions();
}

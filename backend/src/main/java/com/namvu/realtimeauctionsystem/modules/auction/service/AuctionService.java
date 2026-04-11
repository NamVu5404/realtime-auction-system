package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.auction.dto.*;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidRequestV1;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;

public interface AuctionService {
    PageResponse<AuctionResponse> getAuctionsByStatus(AuctionStatus status, Pageable pageable);

    AuctionResponse getAuctionDetail(Long id);

    AuctionResponse saveDraft(CreateAuctionRequest request);

    AuctionResponse scheduleAuction(CreateAuctionRequest request);

    AuctionResponse updateDraftAuction(Long id, UpdateDraftAuctionRequest request);

    AuctionResponse updateScheduledAuction(Long id, UpdateScheduledAuctionRequest request);

    CancelAuctionResponse cancelAuction(Long id, CancelAuctionRequest request);

    PlaceBidResponse placeBidV1(PlaceBidRequestV1 request);

    PageResponse<AuctionResponse> filterSellerAuction(String keyword, Instant startTime, Instant endTime,
                                                AuctionStatus status, Pageable pageable);

    PageResponse<AuctionResponse> filterAdminAuction(String keyword, Instant startTime, Instant endTime,
                                                AuctionStatus status, Pageable pageable);

    PageResponse<AuctionHistoryResponse> getAuctionHistory(Long id, Pageable pageable);

    int applyBid(Long auctionId, BigDecimal newPrice, Long bidderId, Instant finalEndTime, Integer nextExtensionCount);

    void cancelFutureAuctions(Long userId);

    Auction getAuctionDetailById(Long id);

    Auction saveAuction(Auction auction);

    Auction getAuctionReference(Long auctionId);

    AuctionStateSnapshot getAuctionState(Long auctionId);

    AuctionWinProjection getAuctionWinMetrics(Long bidderId);
}

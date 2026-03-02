package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.auction.*;
import com.namvu.realtimeauctionsystem.dto.bid.PlaceBidRequestV1;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.bid.PlaceBidResponse;
import com.namvu.realtimeauctionsystem.enums.AuctionStatus;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

public interface AuctionService {
    PageResponse<AuctionResponse> getAuctionsByStatus(AuctionStatus status, Pageable pageable);

    AuctionResponse getAuctionDetail(Long id);

    AuctionResponse saveDraft(CreateAuctionRequest request);

    AuctionResponse scheduleAuction(CreateAuctionRequest request);

    AuctionResponse updateDraftAuction(Long id, UpdateDraftAuctionRequest request);

    AuctionResponse updateScheduledAuction(Long id, UpdateScheduledAuctionRequest request);

    CancelAuctionResponse cancelAuction(Long id, CancelAuctionRequest request);

    PlaceBidResponse placeBids(PlaceBidRequestV1 request);

    PageResponse<AuctionResponse> filterAuction(String keyword, Instant startTime, Instant endTime,
                                                AuctionStatus status, Pageable pageable);

    PageResponse<AuctionHistoryResponse> getAuctionHistory(Long id, Pageable pageable);
}

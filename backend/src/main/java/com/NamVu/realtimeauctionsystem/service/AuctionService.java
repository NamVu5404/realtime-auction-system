package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.request.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.PlaceBidRequestV1;
import com.NamVu.realtimeauctionsystem.dto.request.UpdateDraftAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.UpdateScheduledAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.response.AuctionHistoryResponse;
import com.NamVu.realtimeauctionsystem.dto.response.AuctionResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PlaceBidResponse;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

public interface AuctionService {
    PageResponse<AuctionResponse> getAuctionsByStatus(AuctionStatus status, Pageable pageable);

    AuctionResponse getAuctionDetail(Long id);

    AuctionResponse saveDraft(CreateAuctionRequest request);

    AuctionResponse scheduleAuction(CreateAuctionRequest request);

    AuctionResponse updateDraftAuction(Long id, UpdateDraftAuctionRequest request);

    AuctionResponse updateScheduledAuction(Long id, UpdateScheduledAuctionRequest request);

    AuctionResponse cancelAuction(Long id);

    PlaceBidResponse placeBids(PlaceBidRequestV1 request);

    PageResponse<AuctionResponse> filterAuction(String keyword, Instant startTime, Instant endTime,
                                                AuctionStatus status, Pageable pageable);

    PageResponse<AuctionHistoryResponse> getAuctionHistory(Long id, Pageable pageable);
}

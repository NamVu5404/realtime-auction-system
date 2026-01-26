package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.request.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.PlaceBidRequest;
import com.NamVu.realtimeauctionsystem.dto.response.AuctionResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PlaceBidResponse;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import org.springframework.data.domain.Pageable;

public interface AuctionService {
    PageResponse<AuctionResponse> getAuctionsByStatus(AuctionStatus status, Pageable pageable);

    AuctionResponse getAuctionDetail(Long id);

    AuctionResponse createAuction(CreateAuctionRequest request);

    PlaceBidResponse placeBids(PlaceBidRequest request);
}

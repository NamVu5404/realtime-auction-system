package com.NamVu.realtimeauctionsystem.controller;

import com.NamVu.realtimeauctionsystem.dto.request.PlaceBidRequest;
import com.NamVu.realtimeauctionsystem.dto.response.ApiResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PlaceBidResponse;
import com.NamVu.realtimeauctionsystem.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v2/auctions")
@RequiredArgsConstructor
public class AuctionControllerV2 {

    private final AuctionService auctionService;

    @PostMapping("/{auctionId}/bids")
    public ApiResponse<PlaceBidResponse> placeBids(@RequestBody @Valid PlaceBidRequest request) {
        return ApiResponse.<PlaceBidResponse>builder()
                .result(null)
                .build();
    }
}

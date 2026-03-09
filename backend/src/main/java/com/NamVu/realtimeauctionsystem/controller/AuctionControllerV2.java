package com.namvu.realtimeauctionsystem.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.namvu.realtimeauctionsystem.dto.bid.BidUpdateResult;
import com.namvu.realtimeauctionsystem.dto.bid.PlaceBidRequestV2;
import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.service.BidService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v2/auctions")
@RequiredArgsConstructor
public class AuctionControllerV2 {

    private final BidService bidService;

    @PostMapping("/{auctionId}/bids")
    public ApiResponse<BidUpdateResult> placeBidV2(@PathVariable Long auctionId,
                                                   @RequestBody @Valid PlaceBidRequestV2 request) throws JsonProcessingException {
        Long bidderId = SecurityUtils.getCurrentUserId();

        return ApiResponse.<BidUpdateResult>builder()
                .result(bidService.placeBidV2(auctionId, bidderId, request.getAmount()))
                .build();
    }
}

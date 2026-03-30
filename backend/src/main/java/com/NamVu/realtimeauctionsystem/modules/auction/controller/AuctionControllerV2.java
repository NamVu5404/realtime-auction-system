package com.namvu.realtimeauctionsystem.modules.auction.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidRequestV2;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidService;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
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

        // Chưa check bidderId != sellerId
        return ApiResponse.<BidUpdateResult>builder()
                .result(bidService.placeBidV2(auctionId, bidderId, request.getAmount()))
                .build();
    }
}

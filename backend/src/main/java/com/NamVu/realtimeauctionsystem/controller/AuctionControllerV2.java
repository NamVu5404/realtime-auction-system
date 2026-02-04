package com.NamVu.realtimeauctionsystem.controller;

import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.dto.request.PlaceBidRequestV2;
import com.NamVu.realtimeauctionsystem.dto.response.ApiResponse;
import com.NamVu.realtimeauctionsystem.service.BidService;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v2/auctions")
@RequiredArgsConstructor
public class AuctionControllerV2 {

    private final BidService bidService;

    @PostMapping("/{auctionId}/bids")
    public ApiResponse<BidUpdateResult> placeBids(@PathVariable Long auctionId,
                                                  @RequestBody @Valid PlaceBidRequestV2 request) throws JsonProcessingException {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long bidderId = jwt.getClaim("uid");

        return ApiResponse.<BidUpdateResult>builder()
                .result(bidService.placeBid(auctionId, bidderId, request.getAmount()))
                .build();
    }
}

package com.namvu.realtimeauctionsystem.modules.auction.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidRequestV2;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.BID_PLACED;

@RestController
@RequestMapping("/v2/auctions")
@RequiredArgsConstructor
public class AuctionControllerV2 {

    private final BidService bidService;
    private final AuctionService auctionService;

    @PostMapping("/{auctionId}/bids")
    public ApiResponse<BidUpdateResult> placeBidV2(
            @PathVariable Long auctionId,
            @RequestHeader(value = "X-Auction-Token", required = false) String token,
            @RequestBody @Valid PlaceBidRequestV2 request
    ) throws JsonProcessingException {
        if (token != null) {
            Auction auction = auctionService.getAuctionDetailById(auctionId);
            if (auction.isPrivateMode() && !auction.getToken().equals(token)) {
                throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
            }
        }

        Long bidderId = SecurityUtils.getCurrentUserId();
        return ApiResponse.of(BID_PLACED, bidService.placeBidV2(auctionId, bidderId, request.getAmount()));
    }
}

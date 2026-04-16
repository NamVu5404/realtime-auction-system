package com.namvu.realtimeauctionsystem.modules.bid.controller;

import com.namvu.realtimeauctionsystem.modules.bid.dto.MyBidHistoryResponse;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.bid.dto.MyBidStatsResponse;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/bids")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    @GetMapping("/my-history")
    public ApiResponse<PageResponse<MyBidHistoryResponse>> getMyBidHistory(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(bidService.getMyBidHistory(pageable));
    }

    @GetMapping("/my-stats")
    public ApiResponse<MyBidStatsResponse> getMyBidStats(
            @RequestParam(value = "period", defaultValue = "MONTH") String period
    ) {
        return ApiResponse.ok(bidService.getMyBidStats(period));
    }

    @GetMapping("/users/{userId}/stats")
    public ApiResponse<MyBidStatsResponse> getBidStatsAdmin(
            @PathVariable Long userId,
            @RequestParam(value = "period", defaultValue = "MONTH") String period
    ) {
        return ApiResponse.ok(bidService.getBidStatsAdmin(userId, period));
    }

    @GetMapping("/users/{userId}/history")
    public ApiResponse<PageResponse<MyBidHistoryResponse>> getBidHistoryForAdmin(
            @PathVariable Long userId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(bidService.getBidHistoryForAdmin(userId, pageable));
    }
}

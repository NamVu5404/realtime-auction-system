package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.bid.MyBidHistoryResponse;
import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.service.BidService;
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

        return ApiResponse.<PageResponse<MyBidHistoryResponse>>builder()
                .result(bidService.getMyBidHistory(pageable))
                .build();
    }

    @GetMapping("/users/{userId}/history")
    public ApiResponse<PageResponse<MyBidHistoryResponse>> getBidHistoryForAdmin(
            @PathVariable Long userId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<MyBidHistoryResponse>>builder()
                .result(bidService.getBidHistoryForAdmin(userId, pageable))
                .build();
    }
}

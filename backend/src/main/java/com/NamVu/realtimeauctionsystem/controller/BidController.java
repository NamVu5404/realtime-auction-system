package com.NamVu.realtimeauctionsystem.controller;

import com.NamVu.realtimeauctionsystem.dto.response.ApiResponse;
import com.NamVu.realtimeauctionsystem.dto.response.MyBidHistoryResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.service.BiddingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bids")
@RequiredArgsConstructor
public class BidController {

    private final BiddingService biddingService;

    @GetMapping("/my-history")
    public ApiResponse<PageResponse<MyBidHistoryResponse>> getMyBidHistory(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<MyBidHistoryResponse>>builder()
                .result(biddingService.getMyBidHistory(pageable))
                .build();
    }
}

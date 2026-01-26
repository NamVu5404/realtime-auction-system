package com.NamVu.realtimeauctionsystem.controller;

import com.NamVu.realtimeauctionsystem.dto.request.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.PlaceBidRequest;
import com.NamVu.realtimeauctionsystem.dto.response.ApiResponse;
import com.NamVu.realtimeauctionsystem.dto.response.AuctionResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PlaceBidResponse;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import com.NamVu.realtimeauctionsystem.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auctions")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    // LIVE = LIVE + SCHEDULED (startTime - now <= 1h)
    // UPCOMING = SCHEDULED (startTime - now > 1h)
    @GetMapping
    public ApiResponse<PageResponse<AuctionResponse>> getAuctionsByStatus(
            @RequestParam AuctionStatus status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<AuctionResponse>>builder()
                .result(auctionService.getAuctionsByStatus(status, pageable))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<AuctionResponse> getAuctionDetail(@PathVariable Long id) {
        return ApiResponse.<AuctionResponse>builder()
                .result(auctionService.getAuctionDetail(id))
                .build();
    }

    @PostMapping
    public ApiResponse<AuctionResponse> createAuction(@RequestBody @Valid CreateAuctionRequest request) {
        return ApiResponse.<AuctionResponse>builder()
                .result(auctionService.createAuction(request))
                .build();
    }

    @PostMapping("/{auctionId}/bids")
    public ApiResponse<PlaceBidResponse> placeBids(@RequestBody @Valid PlaceBidRequest request) {
        return ApiResponse.<PlaceBidResponse>builder()
                .result(auctionService.placeBids(request))
                .build();
    }
}

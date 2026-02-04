package com.NamVu.realtimeauctionsystem.controller;

import com.NamVu.realtimeauctionsystem.dto.request.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.PlaceBidRequestV1;
import com.NamVu.realtimeauctionsystem.dto.request.UpdateDraftAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.UpdateScheduledAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.response.*;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import com.NamVu.realtimeauctionsystem.service.AuctionService;
import com.NamVu.realtimeauctionsystem.service.RedisAuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;

@RestController
@RequestMapping("/v1/auctions")
@RequiredArgsConstructor
public class AuctionControllerV1 {

    private final AuctionService auctionService;
    private final RedisAuctionService redisAuctionService;

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

    @PostMapping("/draft")
    public ApiResponse<AuctionResponse> saveDraft(@Validated(CreateAuctionRequest.Draft.class)
                                                  @RequestBody CreateAuctionRequest request) {
        return ApiResponse.<AuctionResponse>builder()
                .result(auctionService.saveDraft(request))
                .build();
    }

    @PostMapping("/scheduler")
    public ApiResponse<AuctionResponse> scheduleAuction(@Validated(CreateAuctionRequest.Scheduler.class)
                                                        @RequestBody CreateAuctionRequest request) {
        return ApiResponse.<AuctionResponse>builder()
                .result(auctionService.scheduleAuction(request))
                .build();
    }

    @PutMapping("/{id}/draft")
    public ApiResponse<AuctionResponse> updateDraftAuction(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateDraftAuctionRequest request) {
        return ApiResponse.<AuctionResponse>builder()
                .result(auctionService.updateDraftAuction(id, request))
                .build();
    }

    @PutMapping("/{id}/scheduler")
    public ApiResponse<AuctionResponse> updateScheduledAuction(@PathVariable Long id,
                                                               @Valid @RequestBody UpdateScheduledAuctionRequest request) {
        return ApiResponse.<AuctionResponse>builder()
                .result(auctionService.updateScheduledAuction(id, request))
                .build();
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<AuctionResponse> cancelAuction(@PathVariable Long id) {
        return ApiResponse.<AuctionResponse>builder()
                .result(auctionService.cancelAuction(id))
                .build();
    }

    /**
     *  Flow: Distributed lock ở Redis -> Kafka push event cập nhật DB
     *  Chậm, tắc cổ chai nếu nhiều bids cùng lúc, không Atomic
     */
    @PostMapping("/{auctionId}/bids")
    public ApiResponse<PlaceBidResponse> placeBids(@RequestBody @Valid PlaceBidRequestV1 request) {
        return ApiResponse.<PlaceBidResponse>builder()
                .result(auctionService.placeBids(request))
                .build();
    }

    @GetMapping("/filter")
    public ApiResponse<PageResponse<AuctionResponse>> filterAuction(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Instant startTime,
            @RequestParam(required = false) Instant endTime,
            @RequestParam(required = false) AuctionStatus status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<AuctionResponse>>builder()
                .result(auctionService.filterAuction(keyword, startTime, endTime, status, pageable))
                .build();
    }

    @GetMapping("/{id}/history")
    public ApiResponse<PageResponse<AuctionHistoryResponse>> getAuctionHistory(
            @PathVariable Long id,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<AuctionHistoryResponse>>builder()
                .result(auctionService.getAuctionHistory(id, pageable))
                .build();
    }

    @GetMapping("/{id}/current-price")
    public ApiResponse<BigDecimal> getCurrentPrice(@PathVariable Long id) {
        return ApiResponse.<BigDecimal>builder()
                .result(redisAuctionService.getCurrentPrice(id))
                .build();
    }

}

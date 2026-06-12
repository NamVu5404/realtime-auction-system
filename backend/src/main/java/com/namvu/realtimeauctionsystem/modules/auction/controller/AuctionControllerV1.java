package com.namvu.realtimeauctionsystem.modules.auction.controller;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.dto.*;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionAuditService;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidRequestV1;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/auctions")
@RequiredArgsConstructor
public class AuctionControllerV1 {

    private final AuctionService auctionService;
    private final RedisAuctionService redisAuctionService;
    private final AuctionAuditService auctionAuditService;

    // LIVE = LIVE + SCHEDULED (startTime - now <= 1h)
    // UPCOMING = SCHEDULED (startTime - now > 1h)
    @GetMapping
    public ApiResponse<PageResponse<AuctionResponse>> getAuctionsByStatus(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) AuctionStatus status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        AuctionStatus finalStatus = (status == null) ? AuctionStatus.ALL : status;
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auctionService.filterAuctionForUser(q, finalStatus, pageable));
    }

    @GetMapping("/seller/{sellerId}")
    public ApiResponse<PageResponse<AuctionResponse>> getAuctionsBySeller(
            @PathVariable Long sellerId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auctionService.getPublicAuctionsBySeller(sellerId, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<AuctionResponse> getAuctionDetail(
            @PathVariable Long id,
            @RequestHeader(value = "X-Auction-Token", required = false) String token
    ) {
        return ApiResponse.ok(auctionService.getAuctionDetail(id, token));
    }

    @PostMapping("/draft")
    public ApiResponse<AuctionResponse> saveDraft(@Validated(CreateAuctionRequest.Draft.class)
                                                  @RequestBody CreateAuctionRequest request) {
        return ApiResponse.of(CREATED, auctionService.saveDraft(request));
    }

    @PostMapping("/scheduler")
    public ApiResponse<AuctionResponse> scheduleAuction(@Validated(CreateAuctionRequest.Scheduler.class)
                                                        @RequestBody CreateAuctionRequest request) {
        return ApiResponse.of(CREATED, auctionService.scheduleAuction(request));
    }

    @PutMapping("/{id}/draft")
    public ApiResponse<AuctionResponse> updateDraftAuction(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateDraftAuctionRequest request) {
        return ApiResponse.of(DRAFT_AUCTION_UPDATED, auctionService.updateDraftAuction(id, request));
    }

    @PutMapping("/{id}/scheduler")
    public ApiResponse<AuctionResponse> updateScheduledAuction(@PathVariable Long id,
                                                               @Valid @RequestBody UpdateScheduledAuctionRequest request) {
        return ApiResponse.of(SCHEDULED_AUCTION_UPDATED, auctionService.updateScheduledAuction(id, request));
    }

    @PostMapping("/{auctionId}/relist")
    public ApiResponse<AuctionResponse> relistAuction(@PathVariable Long auctionId) {
        return ApiResponse.of(AUCTION_RELIST, auctionService.relistAuction(auctionId));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<CancelAuctionResponse> cancelAuction(@PathVariable Long id,
                                                            @RequestBody @Valid CancelAuctionRequest request) {
        return ApiResponse.of(AUCTION_CANCELLED, auctionService.cancelAuction(id, request));
    }

    /**
     *  Flow: Distributed lock ở Redis -> Kafka push event cập nhật DB
     *  Chậm, tắc cổ chai nếu nhiều bids cùng lúc, không Atomic
     */
    @PostMapping("/{auctionId}/bids")
    public ApiResponse<PlaceBidResponse> placeBidV1(@PathVariable Long auctionId,
                                                   @RequestBody @Valid PlaceBidRequestV1 request) {
        return ApiResponse.of(BID_PLACED, auctionService.placeBidV1(request));
    }

    @GetMapping("/filter-seller")
    public ApiResponse<PageResponse<AuctionResponse>> filterSellerAuction(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Instant startTime,
            @RequestParam(required = false) Instant endTime,
            @RequestParam(required = false) AuctionStatus status,
            @RequestParam(required = false) Boolean privateMode,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auctionService.filterSellerAuction(keyword, startTime, endTime, status, privateMode, pageable));
    }

    @GetMapping("/filter-admin")
    public ApiResponse<PageResponse<AuctionResponse>> filterAdminAuction(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Instant startTime,
            @RequestParam(required = false) Instant endTime,
            @RequestParam(required = false) AuctionStatus status,
            @RequestParam(required = false) Boolean privateMode,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auctionService.filterAdminAuction(keyword, startTime, endTime, status, privateMode, pageable));
    }

    @GetMapping("/{id}/history")
    public ApiResponse<PageResponse<AuctionHistoryResponse>> getAuctionHistory(
            @PathVariable Long id,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auctionService.getAuctionHistory(id, pageable));
    }

    @GetMapping("/{id}/current-price")
    public ApiResponse<BigDecimal> getCurrentPrice(@PathVariable Long id) {
        return ApiResponse.ok(redisAuctionService.getCurrentPrice(id));
    }

    @GetMapping("/{auctionId}/audit")
    public ApiResponse<PageResponse<AuctionAuditResponse>> getAuctionAudit(
            @PathVariable Long auctionId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auctionAuditService.getAuctionAudit(auctionId, pageable));
    }

    @GetMapping("/{auctionId}/result")
    public ApiResponse<AuctionAuditResponse> getAuctionResult(@PathVariable Long auctionId) {
        return ApiResponse.ok(auctionAuditService.getAuctionResult(auctionId));
    }

    /**
     *  Dùng khi Kafka down
     *  Trade off: mất notifications
     */
    @GetMapping("/{auctionId}/state")
    public ApiResponse<AuctionStateSnapshot> getAuctionState(@PathVariable Long auctionId) {
        return ApiResponse.ok(auctionService.getAuctionState(auctionId));
    }

    @GetMapping("/seller/stats")
    @PreAuthorize("hasAuthority('SELLER')")
    public ApiResponse<SellerStatsResponse> getMySellerStats(
            @RequestParam(value = "period", defaultValue = "MONTH") String period
    ) {
        Long sellerId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(auctionService.getSellerStats(sellerId, period));
    }

    @GetMapping("/sellers/{sellerId}/stats")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<SellerStatsResponse> getSellerStatsAdmin(
            @PathVariable Long sellerId,
            @RequestParam(value = "period", defaultValue = "MONTH") String period
    ) {
        return ApiResponse.ok(auctionService.getSellerStats(sellerId, period));
    }

    @GetMapping("/{id}/token")
    public ApiResponse<String> getAuctionToken(@PathVariable Long id) {
        return ApiResponse.ok(auctionService.getAuctionToken(id));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<AuctionResponse> approveAuction(@PathVariable Long id) {
        return ApiResponse.of(AUCTION_REVIEW_APPROVED, auctionService.approveAuction(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<AuctionResponse> rejectAuction(
            @PathVariable Long id,
            @RequestParam String reason) {
        return ApiResponse.of(AUCTION_REVIEW_REJECTED, auctionService.rejectAuction(id, reason));
    }

    @GetMapping("/pending-review/count")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Long> getPendingReviewCount() {
        return ApiResponse.ok(auctionService.countPendingReviewAuctions());
    }

    @GetMapping("/my-recent-bids")
    public ApiResponse<List<AuctionResponse>> getMyRecentBidAuctions(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ApiResponse.ok(auctionService.getMyRecentBidAuctions(limit));
    }

    @GetMapping("/my-participated")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<AuctionResponse>> getMyParticipatedAuctions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(auctionService.getMyParticipatedAuctions(page, size));
    }

    @GetMapping("/trending")
    public ApiResponse<List<AuctionResponse>> getTrendingAuctions(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ApiResponse.ok(auctionService.getTrendingAuctions(limit));
    }

    @GetMapping("/most-wishlisted")
    public ApiResponse<List<AuctionResponse>> getMostWishlistedAuctions(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ApiResponse.ok(auctionService.getMostWishlistedAuctions(limit));
    }
}

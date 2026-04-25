package com.namvu.realtimeauctionsystem.modules.wishlist.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.wishlist.dto.WishListBatchCheckRequest;
import com.namvu.realtimeauctionsystem.modules.wishlist.dto.WishListRequest;
import com.namvu.realtimeauctionsystem.modules.wishlist.dto.WishListResponse;
import com.namvu.realtimeauctionsystem.modules.wishlist.service.WishListService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/wishlists")
@RequiredArgsConstructor
public class WishListController {

    private final WishListService wishListService;

    @PostMapping
    public ApiResponse<WishListResponse> addToWishList(@RequestBody @Valid WishListRequest request) {
        return ApiResponse.of(WISHLIST_ADDED, wishListService.addToWishList(request.getAuctionId()));
    }

    @DeleteMapping("/{auctionId}")
    public ApiResponse<Void> removeFromWishList(@PathVariable Long auctionId) {
        wishListService.removeFromWishList(auctionId);
        return ApiResponse.of(WISHLIST_REMOVED, null);
    }

    @GetMapping
    public ApiResponse<PageResponse<WishListResponse>> getMyWishList(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(wishListService.getMyWishList(pageable));
    }

    @PostMapping("/batch-check")
    public ApiResponse<Set<Long>> batchCheck(@RequestBody @Valid WishListBatchCheckRequest request) {
        return ApiResponse.ok(wishListService.getWishListedAuctionIds(request.getAuctionIds()));
    }
}

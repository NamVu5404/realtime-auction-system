package com.namvu.realtimeauctionsystem.modules.wishlist.service;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.wishlist.dto.WishListResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

public interface WishListService {
    WishListResponse addToWishList(Long auctionId);

    void removeFromWishList(Long auctionId);

    PageResponse<WishListResponse> getMyWishList(Pageable pageable);

    Set<Long> getWishListedAuctionIds(List<Long> auctionIds);

    Set<Long> getUserIdsByAuctionId(Long auctionId);
}

package com.namvu.realtimeauctionsystem.modules.wishlist.service.impl;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionImageService;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import com.namvu.realtimeauctionsystem.modules.wishlist.dto.WishListResponse;
import com.namvu.realtimeauctionsystem.modules.wishlist.entity.WishList;
import com.namvu.realtimeauctionsystem.modules.wishlist.mapper.WishListMapper;
import com.namvu.realtimeauctionsystem.modules.wishlist.repository.WishListRepository;
import com.namvu.realtimeauctionsystem.modules.wishlist.service.WishListService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;


@Service
@RequiredArgsConstructor
public class WishListServiceImpl implements WishListService {

    private final WishListRepository wishListRepository;
    private final WishListMapper wishListMapper;
    private final UserService userService;
    private final AuctionService auctionService;
    private final AuctionImageService auctionImageService;

    @Override
    @Transactional
    public WishListResponse addToWishList(Long auctionId) {
        Long userId = SecurityUtils.getCurrentUserId();

        if (wishListRepository.existsByUserIdAndAuctionId(userId, auctionId)) {
            throw new AppException(ErrorCode.WISHLIST_ALREADY_EXISTS);
        }

        Auction auction = auctionService.getAuctionDetailById(auctionId);

        WishList wishList = WishList.builder()
                .user(userService.getUserReference(userId))
                .auction(auction)
                .build();

        wishList = wishListRepository.save(wishList);
        WishListResponse response = wishListMapper.mapToResponse(wishList);
        setPrimaryImage(response, auctionId);
        return response;
    }

    @Override
    @Transactional
    public void removeFromWishList(Long auctionId) {
        Long userId = SecurityUtils.getCurrentUserId();

        if (!wishListRepository.existsByUserIdAndAuctionId(userId, auctionId)) {
            throw new AppException(ErrorCode.WISHLIST_NOT_FOUND);
        }

        wishListRepository.deleteByUserIdAndAuctionId(userId, auctionId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WishListResponse> getMyWishList(Pageable pageable) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<WishList> page = wishListRepository.findByUserIdWithAuction(userId, pageable);

        List<Long> auctionIds = page.getContent().stream()
                .map(w -> w.getAuction().getId())
                .toList();

        Map<Long, String> primaryImageByAuctionId = buildPrimaryImageMap(auctionIds);

        List<WishListResponse> responses = page.getContent().stream()
                .map(w -> {
                    WishListResponse resp = wishListMapper.mapToResponse(w);
                    resp.setImage(primaryImageByAuctionId.get(w.getAuction().getId()));
                    return resp;
                })
                .toList();

        return PageResponse.<WishListResponse>builder()
                .data(responses)
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getWishListedAuctionIds(List<Long> auctionIds) {
        if (auctionIds == null || auctionIds.isEmpty()) return Set.of();
        Long userId = SecurityUtils.getCurrentUserId();
        return wishListRepository.findWishListedAuctionIds(userId, auctionIds);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getUserIdsByAuctionId(Long auctionId) {
        return wishListRepository.findUserIdsByAuctionId(auctionId);
    }

    private void setPrimaryImage(WishListResponse response, Long auctionId) {
        List<FileResponse> images = auctionImageService.getAuctionImages(List.of(auctionId));
        images.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .findFirst()
                .or(() -> images.stream().findFirst())
                .ifPresent(img -> response.setImage(img.filePath() + "/" + img.storageName()));
    }

    private Map<Long, String> buildPrimaryImageMap(List<Long> auctionIds) {
        return auctionImageService.getPrimaryImageMap(auctionIds);
    }
}

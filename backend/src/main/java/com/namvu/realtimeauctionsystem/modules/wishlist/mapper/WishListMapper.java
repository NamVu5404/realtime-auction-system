package com.namvu.realtimeauctionsystem.modules.wishlist.mapper;

import com.namvu.realtimeauctionsystem.modules.wishlist.dto.WishListResponse;
import com.namvu.realtimeauctionsystem.modules.wishlist.entity.WishList;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WishListMapper {

    @Mapping(source = "auction.id", target = "auctionId")
    @Mapping(source = "auction.title", target = "title")
    @Mapping(source = "auction.startPrice", target = "startPrice")
    @Mapping(source = "auction.currentPrice", target = "currentPrice")
    @Mapping(source = "auction.status", target = "status")
    @Mapping(source = "auction.startTime", target = "startTime")
    @Mapping(source = "auction.endTime", target = "endTime")
    @Mapping(source = "auction.seller.name", target = "sellerName")
    @Mapping(source = "auction.privateMode", target = "privateMode")
    @Mapping(target = "image", ignore = true)
    WishListResponse mapToResponse(WishList wishList);
}

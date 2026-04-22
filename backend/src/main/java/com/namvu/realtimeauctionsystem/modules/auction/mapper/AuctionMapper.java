package com.namvu.realtimeauctionsystem.modules.auction.mapper;

import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionResponse;
import com.namvu.realtimeauctionsystem.modules.auction.dto.CreateAuctionRequest;
import com.namvu.realtimeauctionsystem.modules.auction.dto.UpdateDraftAuctionRequest;
import com.namvu.realtimeauctionsystem.modules.auction.dto.UpdateScheduledAuctionRequest;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface AuctionMapper {
    AuctionResponse mapToResponse(Auction auction);

    @Mapping(target = "id", ignore = true)
    Auction mapToEntity(CreateAuctionRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(CreateAuctionRequest request, @MappingTarget Auction auction);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    void updateEntity(UpdateDraftAuctionRequest request, @MappingTarget Auction auction);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    void updateEntity(UpdateScheduledAuctionRequest request, @MappingTarget Auction auction);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "currentPrice", ignore = true)
    @Mapping(target = "highestBidder", ignore = true)
    @Mapping(target = "extensionCount", ignore = true)
    @Mapping(target = "notifiedEndingSoon", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "startTime", ignore = true)
    @Mapping(target = "endTime", ignore = true)
    Auction cloneToNewDraft(Auction auction);
}

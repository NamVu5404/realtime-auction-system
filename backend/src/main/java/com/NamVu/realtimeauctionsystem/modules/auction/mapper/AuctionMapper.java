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
}

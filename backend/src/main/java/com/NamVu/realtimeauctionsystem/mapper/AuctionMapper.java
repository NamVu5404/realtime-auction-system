package com.namvu.realtimeauctionsystem.mapper;

import com.namvu.realtimeauctionsystem.dto.auction.CreateAuctionRequest;
import com.namvu.realtimeauctionsystem.dto.auction.UpdateDraftAuctionRequest;
import com.namvu.realtimeauctionsystem.dto.auction.UpdateScheduledAuctionRequest;
import com.namvu.realtimeauctionsystem.dto.auction.AuctionResponse;
import com.namvu.realtimeauctionsystem.entity.Auction;
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

package com.NamVu.realtimeauctionsystem.mapper;

import com.NamVu.realtimeauctionsystem.dto.request.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.UpdateDraftAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.UpdateScheduledAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.response.AuctionResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
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

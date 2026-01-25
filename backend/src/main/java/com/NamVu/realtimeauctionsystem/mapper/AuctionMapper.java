package com.NamVu.realtimeauctionsystem.mapper;

import com.NamVu.realtimeauctionsystem.dto.request.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.response.AuctionResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuctionMapper {
    AuctionResponse mapToResponse(Auction auction);

    Auction mapToEntity(CreateAuctionRequest request);
}

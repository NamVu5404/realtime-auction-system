package com.namvu.realtimeauctionsystem.mapper;

import com.namvu.realtimeauctionsystem.dto.auction.AuctionAuditResponse;
import com.namvu.realtimeauctionsystem.entity.AuctionAudit;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuctionAuditMapper {
    AuctionAuditResponse mapToResponse(AuctionAudit auctionAudit);
}

package com.namvu.realtimeauctionsystem.modules.auction.mapper;

import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionAuditResponse;
import com.namvu.realtimeauctionsystem.modules.auction.entity.AuctionAudit;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuctionAuditMapper {
    AuctionAuditResponse mapToResponse(AuctionAudit auctionAudit);
}

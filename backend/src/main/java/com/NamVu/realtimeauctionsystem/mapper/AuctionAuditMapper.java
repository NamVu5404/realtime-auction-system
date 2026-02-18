package com.NamVu.realtimeauctionsystem.mapper;

import com.NamVu.realtimeauctionsystem.dto.auction.AuctionAuditResponse;
import com.NamVu.realtimeauctionsystem.entity.AuctionAudit;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuctionAuditMapper {
    AuctionAuditResponse mapToResponse(AuctionAudit auctionAudit);
}

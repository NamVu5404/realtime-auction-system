package com.namvu.realtimeauctionsystem.modules.auction.dto;

import com.namvu.realtimeauctionsystem.common.constant.AuctionActionType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class AuctionAuditResponse {
    private Long id;
    private AuctionActionType actionType;
    private Instant createdAt;
    private String updatedBy;
    private Map<String, Object> details;
}

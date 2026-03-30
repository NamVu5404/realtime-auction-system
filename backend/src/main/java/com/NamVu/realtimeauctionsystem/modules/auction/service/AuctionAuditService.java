package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionAuditResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AuctionAuditService {
    PageResponse<AuctionAuditResponse> getAuctionAudit(Long auctionId, Pageable pageable);

    AuctionAuditResponse getAuctionResult(Long auctionId);
}

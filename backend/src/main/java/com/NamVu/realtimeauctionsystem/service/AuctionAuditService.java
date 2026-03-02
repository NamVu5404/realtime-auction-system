package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.auction.AuctionAuditResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AuctionAuditService {
    PageResponse<AuctionAuditResponse> getAuctionAudit(Long auctionId, Pageable pageable);
}

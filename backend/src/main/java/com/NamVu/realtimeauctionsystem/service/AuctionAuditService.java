package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.auction.AuctionAuditResponse;
import com.NamVu.realtimeauctionsystem.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AuctionAuditService {
    PageResponse<AuctionAuditResponse> getAuctionAudit(Long auctionId, Pageable pageable);
}

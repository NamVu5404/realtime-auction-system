package com.namvu.realtimeauctionsystem.modules.ai.service;

import com.namvu.realtimeauctionsystem.common.constant.AiReviewDecision;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.ai.dto.AiLogCountResponse;
import com.namvu.realtimeauctionsystem.modules.ai.dto.AiLogResponse;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import org.springframework.data.domain.Pageable;

public interface AiReviewService {
    void review(Auction auction);

    PageResponse<AiLogResponse> getAiLogs(Long auctionId, AiReviewDecision decision, Pageable pageable);

    AiLogCountResponse countAiLogs();
}

package com.namvu.realtimeauctionsystem.modules.ai.dto;

import com.namvu.realtimeauctionsystem.common.constant.AiReviewDecision;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class AiLogResponse {
    Long id;
    Long auctionId;
    String auctionTitle;
    AiReviewDecision decision;
    BigDecimal confidence;
    String reasons;
    Long responseTimeMs;
    String model;
    String errorMessage;
    Instant createdAt;
}

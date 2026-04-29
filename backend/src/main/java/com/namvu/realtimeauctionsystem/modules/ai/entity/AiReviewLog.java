package com.namvu.realtimeauctionsystem.modules.ai.entity;

import com.namvu.realtimeauctionsystem.common.constant.AiReviewDecision;
import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "ai_review_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AiReviewLog extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AiReviewDecision decision;

    @Column(precision = 3, scale = 2)
    private BigDecimal confidence;

    @Column(columnDefinition = "TEXT")
    private String reasons;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "model")
    private String model;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}

package com.namvu.realtimeauctionsystem.modules.bid.entity;

import com.namvu.realtimeauctionsystem.common.constant.OutboxEventType;
import com.namvu.realtimeauctionsystem.common.constant.OutboxStatus;
import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Entity
@Table(name = "outbox", indexes = {
        @Index(name = "idx_status_created", columnList = "status, created_at")
})
@SuperBuilder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Outbox extends Auditable {

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private OutboxEventType eventType;

    @Column(name = "auction_id", nullable = false)
    private Long auctionId;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    private OutboxStatus status;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "sent_at")
    private Instant sentAt;

    public void markSent() {
        this.status = OutboxStatus.SENT;
        this.sentAt = Instant.now();
    }

    public void markFailed() {
        this.retryCount++;
        if (this.retryCount >= MAX_RETRY) {
            this.status = OutboxStatus.FAILED;
        }
    }

    private static final int MAX_RETRY = 5;
}

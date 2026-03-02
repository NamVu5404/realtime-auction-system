package com.namvu.realtimeauctionsystem.entity;

import com.namvu.realtimeauctionsystem.enums.OutboxEventType;
import com.namvu.realtimeauctionsystem.enums.OutboxStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "outbox", indexes = {
        @Index(name = "idx_status_created", columnList = "status, created_at")
})
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Outbox extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

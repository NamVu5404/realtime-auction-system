package com.NamVu.realtimeauctionsystem.entity;

import com.NamVu.realtimeauctionsystem.enums.FraudType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "fraud_logs",
        indexes = {
                @Index(name = "idx_fraud_user", columnList = "user_id"),
                @Index(name = "idx_fraud_auction", columnList = "auction_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudLog extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id")
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bid_id")
    private Bid bid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FraudType type;

    @Column(nullable = false)
    private String reason;
}

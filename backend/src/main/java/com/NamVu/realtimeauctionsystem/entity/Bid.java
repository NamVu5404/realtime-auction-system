package com.NamVu.realtimeauctionsystem.entity;

import com.NamVu.realtimeauctionsystem.enums.BidStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bids")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private User bidder;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BidStatus status;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }
}

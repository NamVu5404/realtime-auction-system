package com.namvu.realtimeauctionsystem.modules.fraud.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;

import com.namvu.realtimeauctionsystem.common.enums.FraudType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

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
@SuperBuilder
public class FraudLog extends Auditable {

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

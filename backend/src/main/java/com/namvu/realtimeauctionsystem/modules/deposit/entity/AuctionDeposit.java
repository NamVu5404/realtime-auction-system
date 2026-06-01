package com.namvu.realtimeauctionsystem.modules.deposit.entity;

import com.namvu.realtimeauctionsystem.common.constant.DepositStatus;
import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "auction_deposits",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_deposit_user_auction",
                columnNames = {"user_id", "auction_id"}
        ),
        indexes = {
                @Index(name = "idx_deposit_auction_status", columnList = "auction_id, status"),
                @Index(name = "idx_deposit_user", columnList = "user_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AuctionDeposit extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Column(name = "deposit_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DepositStatus status;

    @Column(name = "released_at")
    private Instant releasedAt;
}

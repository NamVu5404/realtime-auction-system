package com.namvu.realtimeauctionsystem.modules.wallet.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Wallet extends Auditable {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "available_balance", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "locked_balance", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal lockedBalance = BigDecimal.ZERO;

    @Version
    @Column(name = "version")
    private Long version;
}

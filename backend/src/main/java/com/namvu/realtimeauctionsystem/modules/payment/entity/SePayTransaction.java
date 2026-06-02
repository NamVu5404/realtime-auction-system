package com.namvu.realtimeauctionsystem.modules.payment.entity;

import com.namvu.realtimeauctionsystem.common.constant.SePayStatus;
import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
    name = "sepay_transactions",
    uniqueConstraints = @UniqueConstraint(name = "uk_sepay_id", columnNames = "sepay_id"),
    indexes = @Index(name = "idx_sepay_user", columnList = "user_id")
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SePayTransaction extends Auditable {

    @Column(name = "sepay_id", nullable = false)
    private Long sePayId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String gateway;

    @Column(name = "transfer_amount", nullable = false)
    private Long transferAmount;

    @Column(name = "transfer_type", length = 10)
    private String transferType;

    private String code;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "reference_code")
    private String referenceCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SePayStatus status;
}

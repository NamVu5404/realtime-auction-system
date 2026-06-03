package com.namvu.realtimeauctionsystem.modules.payment.entity;

import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(
    name = "top_up_orders",
    uniqueConstraints = @UniqueConstraint(name = "uk_invoice_number", columnNames = "invoice_number"),
    indexes = @Index(name = "idx_topup_user", columnList = "user_id")
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class TopUpOrder extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TopUpOrderStatus status;
}

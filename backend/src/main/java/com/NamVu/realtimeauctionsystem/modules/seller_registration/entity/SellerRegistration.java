package com.namvu.realtimeauctionsystem.modules.seller_registration.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;

import com.namvu.realtimeauctionsystem.common.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Entity
@Table(name = "seller_registration")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRegistration extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private Instant approvedAt;

    @Column(name = "reject_reason")
    private String rejectReason;

    @PrePersist
    void onCreate() {
        this.status = RequestStatus.PENDING;
    }
}

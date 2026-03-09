package com.namvu.realtimeauctionsystem.entity;

import com.namvu.realtimeauctionsystem.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "seller_registration")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRegistration extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

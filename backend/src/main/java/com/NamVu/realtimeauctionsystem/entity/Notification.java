package com.namvu.realtimeauctionsystem.entity;

import com.namvu.realtimeauctionsystem.enums.NotificationConstant;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_user_id_created", columnList = "user_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Notification extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationConstant.NotificationType type;

    private String content;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    private String redirectUrl;

    @PrePersist
    public void prePersist() {
        this.read = false;
    }
}

package com.namvu.realtimeauctionsystem.entity;

import com.namvu.realtimeauctionsystem.enums.UserActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "user_audit",
        indexes = {
                @Index(name = "idx_user_audit_user_created_desc", columnList = "user_id, created_at DESC")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAudit extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> details;
}

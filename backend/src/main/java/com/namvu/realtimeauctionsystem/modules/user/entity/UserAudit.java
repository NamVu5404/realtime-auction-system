package com.namvu.realtimeauctionsystem.modules.user.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;

import com.namvu.realtimeauctionsystem.common.constant.UserActionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
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
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class UserAudit extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> details;
}

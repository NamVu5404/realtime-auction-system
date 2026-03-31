package com.namvu.realtimeauctionsystem.modules.user.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;

import com.namvu.realtimeauctionsystem.common.enums.Role;
import com.namvu.realtimeauctionsystem.common.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class User extends Auditable {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private Set<Role> roles = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @PrePersist
    protected void onCreate() {
        this.status = UserStatus.ACTIVE;
        this.roles.add(Role.USER);
    }
}
package com.namvu.realtimeauctionsystem.modules.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private Set<Role> roles;
    private String avatarUrl;

    @JsonProperty("isVerifiedIdentity")
    private boolean isVerifiedIdentity;

    @JsonProperty("isFaceMatch")
    private boolean isFaceMatch;
}

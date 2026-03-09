package com.namvu.realtimeauctionsystem.dto.user;

import com.namvu.realtimeauctionsystem.enums.Role;
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
    private Set<Role> roles;
    private String avatarUrl;
}

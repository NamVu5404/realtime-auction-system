package com.namvu.realtimeauctionsystem.dto.user;

import com.namvu.realtimeauctionsystem.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private Role role;
    private String avatarUrl;
}

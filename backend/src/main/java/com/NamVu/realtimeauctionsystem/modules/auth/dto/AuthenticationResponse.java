package com.namvu.realtimeauctionsystem.modules.auth.dto;

import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticationResponse {
    private String accessToken;
    private String refreshToken;
    private UserResponse user;
}

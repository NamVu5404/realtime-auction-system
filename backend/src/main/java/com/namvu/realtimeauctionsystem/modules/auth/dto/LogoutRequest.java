package com.namvu.realtimeauctionsystem.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogoutRequest {

    @NotBlank(message = "Access token is required")
    private String accessToken;

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}

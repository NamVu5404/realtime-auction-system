package com.namvu.realtimeauctionsystem.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticationRequest {

    @NotBlank(message = "EMAIL_NOT_BLANK")
    private String email;

    @NotBlank(message = "PASSWORD_NOT_BLANK")
    private String password;
}

package com.namvu.realtimeauctionsystem.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpdateUserRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Pattern(
            regexp = "^\\d{9,15}$",
            message = "Phone number must be between 9 and 15 digits"
    )
    private String phone;
}

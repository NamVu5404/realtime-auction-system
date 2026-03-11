package com.namvu.realtimeauctionsystem.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpdateUserRequest {

    @NotBlank(message = "NAME_NOT_BLANK")
    @Size(max = 255, message = "MAX_CHARACTERS")
    private String name;

    @Pattern(
            regexp = "^\\d{9,15}$",
            message = "INVALID_PHONE"
    )
    private String phone;
}

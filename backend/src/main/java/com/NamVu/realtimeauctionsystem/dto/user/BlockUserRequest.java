package com.NamVu.realtimeauctionsystem.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockUserRequest {

    @NotBlank(message = "REASON_NOT_BLANK")
    private String reason;
}

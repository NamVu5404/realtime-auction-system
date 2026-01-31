package com.NamVu.realtimeauctionsystem.dto.response;

import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockUserResponse {
    private Long userId;
    private UserStatus status;
    private Long by;
    private String reason;
    private Instant timestamp;
}

package com.namvu.realtimeauctionsystem.modules.user.dto;

import com.namvu.realtimeauctionsystem.common.constant.UserStatus;
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
    private String by;
    private String reason;
    private Instant timestamp;
}

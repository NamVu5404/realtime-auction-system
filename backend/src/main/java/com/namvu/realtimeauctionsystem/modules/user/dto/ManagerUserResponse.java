package com.namvu.realtimeauctionsystem.modules.user.dto;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class ManagerUserResponse extends UserResponse {
    private Instant createdAt;
    private UserStatus status;
}

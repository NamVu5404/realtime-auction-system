package com.namvu.realtimeauctionsystem.modules.seller_registration.dto;

import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import com.namvu.realtimeauctionsystem.common.enums.RequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class SellerRegResponse {
    private Long id;
    private UserResponse user;
    private RequestStatus status;
    private Instant approvedAt;
    private String rejectReason;
    private Instant createdAt;
}

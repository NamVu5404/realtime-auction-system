package com.namvu.realtimeauctionsystem.dto.seller;

import com.namvu.realtimeauctionsystem.dto.user.UserResponse;
import com.namvu.realtimeauctionsystem.enums.RequestStatus;
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

package com.namvu.realtimeauctionsystem.dto.user;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class UserAuditResponse {
    private Long id;
    private String actionType;
    private Instant createdAt;
    private Map<String, Object> details;
}

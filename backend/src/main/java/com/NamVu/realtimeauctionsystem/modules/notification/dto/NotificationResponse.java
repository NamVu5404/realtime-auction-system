package com.namvu.realtimeauctionsystem.modules.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private boolean read;
    private String redirectUrl;
    private Instant createdAt;
}

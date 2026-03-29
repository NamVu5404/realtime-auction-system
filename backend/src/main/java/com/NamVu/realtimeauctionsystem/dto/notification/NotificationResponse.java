package com.namvu.realtimeauctionsystem.dto.notification;

import com.namvu.realtimeauctionsystem.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private Long userId;
    private NotificationType type;
    private String content;
    private String metadata;
    private boolean read;
    private String redirectUrl;
    private Instant createdAt;
}

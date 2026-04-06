package com.namvu.realtimeauctionsystem.modules.notification.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private boolean read;
    private String redirectUrl;
    private Instant createdAt;
}

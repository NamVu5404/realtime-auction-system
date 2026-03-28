package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.notification.NotificationResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable);

    void markNotificationAsRead(Long notificationId);
}

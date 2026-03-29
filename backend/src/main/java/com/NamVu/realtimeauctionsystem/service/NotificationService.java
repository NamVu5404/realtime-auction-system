package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.notification.NotificationResponse;
import com.namvu.realtimeauctionsystem.enums.NotificationType;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    void createAndPushNotification(Long recipientId, NotificationType type, String content, String redirectUrl);

    PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable);

    void markNotificationAsRead(Long notificationId);
}

package com.namvu.realtimeauctionsystem.modules.notification.service;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.notification.dto.NotificationResponse;
import com.namvu.realtimeauctionsystem.common.constant.NotificationType;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    void createAndPushNotification(Long recipientId, NotificationType type, String content, String redirectUrl);

    List<NotificationResponse> getNotificationsForBell(Long userId);

    PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable);

    Integer getUnreadCountNotifications(Long userId);

    void markNotificationAsRead(Long notificationId);

    Integer markAllNotificationsAsReadForUser(Long userId);

    void deleteNotification(Long id);

    void deleteAllNotificationsForUser(Long userId);
}

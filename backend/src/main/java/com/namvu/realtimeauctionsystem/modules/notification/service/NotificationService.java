package com.namvu.realtimeauctionsystem.modules.notification.service;

import com.namvu.realtimeauctionsystem.common.constant.NotificationConstant;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidEvent;
import com.namvu.realtimeauctionsystem.modules.notification.dto.NotificationResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface NotificationService {
    void createAndPushNotification(Long recipientId, NotificationConstant type, String content, String redirectUrl);

    List<NotificationResponse> getNotificationsForBell(Long userId);

    PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable);

    Integer getUnreadCountNotifications(Long userId);

    void markNotificationAsRead(Long notificationId);

    Integer markAllNotificationsAsReadForUser(Long userId);

    void deleteNotification(Long id);

    void deleteAllNotificationsForUser(Long userId);

    void processBidNotifications(BidEvent event, String title, BigDecimal currentPrice);
}

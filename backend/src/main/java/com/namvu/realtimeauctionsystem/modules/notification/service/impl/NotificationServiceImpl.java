package com.namvu.realtimeauctionsystem.modules.notification.service.impl;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.constant.NotificationType;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.notification.dto.NotificationResponse;
import com.namvu.realtimeauctionsystem.modules.notification.entity.Notification;
import com.namvu.realtimeauctionsystem.modules.notification.mapper.NotificationMapper;
import com.namvu.realtimeauctionsystem.modules.notification.repository.NotificationRepository;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void createAndPushNotification(Long recipientId, NotificationType type, String content, String redirectUrl) {
        Notification notification = Notification.builder()
                .recipient(userService.getUserReference(recipientId))
                .type(type)
                .content(content)
                .redirectUrl(redirectUrl)
                .build();

        notification = notificationRepository.save(notification);

        pushNotification(notification);
    }

    @Override
    public List<NotificationResponse> getNotificationsForBell(Long userId) {
        List<Notification> notifications = notificationRepository.findTop5ByRecipientIdAndReadOrderByCreatedAtDesc(userId, false);
        return notifications.stream().map(notificationMapper::mapToResponse).toList();
    }

    @Override
    public PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable) {
        Page<Notification> notificationPage = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.<NotificationResponse>builder()
                .totalPage(notificationPage.getTotalPages())
                .pageSize(notificationPage.getSize())
                .currentPage(notificationPage.getNumber() + 1)
                .totalElements(notificationPage.getTotalElements())
                .data(notificationPage.map(notificationMapper::mapToResponse).toList())
                .build();
    }

    @Override
    public Integer getUnreadCountNotifications(Long userId) {
        return notificationRepository.countByRecipientIdAndRead(userId, false);
    }

    @Override
    public void markNotificationAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!Objects.equals(notification.getRecipient().getId(), SecurityUtils.getCurrentUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Override
    public Integer markAllNotificationsAsReadForUser(Long userId) {
        return notificationRepository.markAllAsReadForUser(userId);
    }

    @Override
    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!Objects.equals(notification.getRecipient().getId(), SecurityUtils.getCurrentUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        notificationRepository.delete(notification);
    }

    @Override
    public void deleteAllNotificationsForUser(Long userId) {
        notificationRepository.deleteAllNotificationsForUser(userId);
    }

    private void pushNotification(Notification notification) {
        NotificationResponse response = notificationMapper.mapToResponse(notification);

        // Gửi WebSocket đích danh (Private topic)
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + response.getUserId(),
                response
        );

        log.info("Pushed {} notification to user {}", notification.getType(), response.getUserId());
    }
}

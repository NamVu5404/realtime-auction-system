package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.notification.NotificationResponse;
import com.namvu.realtimeauctionsystem.entity.Notification;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.repository.NotificationRepository;
import com.namvu.realtimeauctionsystem.service.NotificationService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable) {
        Page<Notification> notificationPage = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.<NotificationResponse>builder()
                .totalPage(notificationPage.getTotalPages())
                .pageSize(notificationPage.getSize())
                .currentPage(notificationPage.getNumber() + 1)
                .totalElements(notificationPage.getTotalElements())
                .data(notificationPage.map(notification ->
                                NotificationResponse.builder()
                                        .id(notification.getId())
                                        .userId(notification.getRecipient().getId())
                                        .type(notification.getType())
                                        .content(notification.getContent())
                                        .metadata(notification.getMetadata())
                                        .read(notification.isRead())
                                        .redirectUrl(notification.getRedirectUrl())
                                        .createdAt(notification.getCreatedAt())
                                        .build())
                        .toList())
                .build();
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
}

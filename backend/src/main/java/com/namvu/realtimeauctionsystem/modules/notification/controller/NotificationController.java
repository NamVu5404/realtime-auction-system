package com.namvu.realtimeauctionsystem.modules.notification.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.notification.dto.NotificationResponse;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/bell")
    public ApiResponse<List<NotificationResponse>> getNotificationsForBell() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(notificationService.getNotificationsForBell(userId));
    }

    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> getNotificationsForUser(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(notificationService.getNotificationsForUser(userId, pageable));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Integer> getUnreadCountNotifications() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(notificationService.getUnreadCountNotifications(userId));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markNotificationAsRead(id);
        return ApiResponse.of(NOTIFICATION_READ, null);
    }

    @PatchMapping("/mark-all-as-read")
    public ApiResponse<Integer> markAllNotificationsAsRead() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.of(ALL_NOTIFICATIONS_READ,
                notificationService.markAllNotificationsAsReadForUser(userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ApiResponse.of(NOTIFICATION_DELETED, null);
    }

    @DeleteMapping("/all")
    public ApiResponse<Void> deleteAllNotificationsForUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationService.deleteAllNotificationsForUser(userId);
        return ApiResponse.of(ALL_NOTIFICATIONS_DELETED, null);
    }
}

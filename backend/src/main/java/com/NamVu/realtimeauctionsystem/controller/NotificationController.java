package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.notification.NotificationResponse;
import com.namvu.realtimeauctionsystem.service.NotificationService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/bell")
    public ApiResponse<List<NotificationResponse>> getNotificationsForBell() {
        Long userId = SecurityUtils.getCurrentUserId();

        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notificationService.getNotificationsForBell(userId))
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> getNotificationsForUser(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Long userId = SecurityUtils.getCurrentUserId();

        return ApiResponse.<PageResponse<NotificationResponse>>builder()
                .result(notificationService.getNotificationsForUser(userId, pageable))
                .build();
    }

    @GetMapping("/unread-count")
    public ApiResponse<Integer> getUnreadCountNotifications() {
        Long userId = SecurityUtils.getCurrentUserId();

        return ApiResponse.<Integer>builder()
                .result(notificationService.getUnreadCountNotifications(userId))
                .build();
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markNotificationAsRead(id);
        return ApiResponse.<Void>builder().build();
    }

    @PatchMapping("/mark-all-as-read")
    public ApiResponse<Integer> markAllNotificationsAsRead() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<Integer>builder()
                .result(notificationService.markAllNotificationsAsReadForUser(userId))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/all")
    public ApiResponse<Void> deleteAllNotificationsForUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationService.deleteAllNotificationsForUser(userId);
        return ApiResponse.<Void>builder().build();
    }
}

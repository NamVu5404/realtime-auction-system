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

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

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

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markNotificationAsRead(id);
        return ApiResponse.<Void>builder().build();
    }
}

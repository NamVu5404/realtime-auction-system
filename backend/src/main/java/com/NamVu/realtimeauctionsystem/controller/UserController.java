package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.user.*;
import com.namvu.realtimeauctionsystem.enums.Role;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
import com.namvu.realtimeauctionsystem.service.UserAuditService;
import com.namvu.realtimeauctionsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserAuditService auditService;

    @GetMapping
    public ApiResponse<PageResponse<ManagerUserResponse>> getUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "role", required = false) Role role,
            @RequestParam(value = "status", required = false) UserStatus status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<ManagerUserResponse>>builder()
                .result(userService.getUsers(keyword, role, status, pageable))
                .build();
    }

    @PatchMapping("/{userId}/block")
    public ApiResponse<BlockUserResponse> blockUser(@PathVariable Long userId, @RequestBody @Valid BlockUserRequest request) {
        return ApiResponse.<BlockUserResponse>builder()
                .result(userService.blockUser(userId, request))
                .build();
    }

    @PatchMapping("/{userId}/unblock")
    public ApiResponse<BlockUserResponse> unblockUser(@PathVariable Long userId, @RequestBody @Valid BlockUserRequest request) {
        return ApiResponse.<BlockUserResponse>builder()
                .result(userService.unblockUser(userId, request))
                .build();
    }

    @GetMapping("/{userId}/audit")
    public ApiResponse<PageResponse<UserAuditResponse>> getUserAudit(
            @PathVariable Long userId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<UserAuditResponse>>builder()
                .result(auditService.getUserAudit(userId, pageable))
                .build();
    }

    @GetMapping("/audit")
    public ApiResponse<PageResponse<UserAuditResponse>> getMyAccountAudit(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);

        return ApiResponse.<PageResponse<UserAuditResponse>>builder()
                .result(auditService.getMyAccountAudit(pageable))
                .build();
    }

    @PutMapping("/profile")
    public ApiResponse<UserResponse> updateProfile(@RequestBody @Valid UpdateUserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateProfile(request))
                .build();
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateAvatar(file))
                .build();
    }
}

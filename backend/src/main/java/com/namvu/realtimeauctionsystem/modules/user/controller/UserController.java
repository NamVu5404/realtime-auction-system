package com.namvu.realtimeauctionsystem.modules.user.controller;

import com.namvu.realtimeauctionsystem.modules.user.dto.BlockUserRequest;
import com.namvu.realtimeauctionsystem.modules.user.dto.BlockUserResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.ManagerUserResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.UpdateUserRequest;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserAuditResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.constant.Role;
import com.namvu.realtimeauctionsystem.common.constant.UserStatus;
import com.namvu.realtimeauctionsystem.modules.user.service.UserAuditService;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

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
        return ApiResponse.ok(userService.getUsers(keyword, role, status, pageable));
    }

    @PatchMapping("/{userId}/block")
    public ApiResponse<BlockUserResponse> blockUser(@PathVariable Long userId, @RequestBody @Valid BlockUserRequest request) {
        return ApiResponse.of(USER_BLOCKED, userService.blockUser(userId, request));
    }

    @PatchMapping("/{userId}/unblock")
    public ApiResponse<BlockUserResponse> unblockUser(@PathVariable Long userId, @RequestBody @Valid BlockUserRequest request) {
        return ApiResponse.of(USER_UNBLOCKED, userService.unblockUser(userId, request));
    }

    @GetMapping("/{userId}/audit")
    public ApiResponse<PageResponse<UserAuditResponse>> getUserAudit(
            @PathVariable Long userId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auditService.getUserAudit(userId, pageable));
    }

    @GetMapping("/audit")
    public ApiResponse<PageResponse<UserAuditResponse>> getMyAccountAudit(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(auditService.getMyAccountAudit(pageable));
    }

    @PutMapping("/profile")
    public ApiResponse<UserResponse> updateProfile(@RequestBody @Valid UpdateUserRequest request) {
        return ApiResponse.of(PROFILE_UPDATED, userService.updateProfile(request));
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ApiResponse.of(AVATAR_UPLOADED, userService.updateAvatar(file));
    }

    @PatchMapping("/{userId}/upgrade-to-seller")
    public ApiResponse<UserResponse> upgradeToSeller(@PathVariable Long userId) {
        return ApiResponse.of(USER_UPGRADED_TO_SELLER, userService.upgradeToSeller(userId));
    }
}

package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.request.BlockUserRequest;
import com.NamVu.realtimeauctionsystem.dto.response.BlockUserResponse;
import com.NamVu.realtimeauctionsystem.dto.response.ManagerUserResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.Role;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.mapper.UserMapper;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.UserService;
import com.NamVu.realtimeauctionsystem.service.UserTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final UserTrackingService trackingService;

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<ManagerUserResponse> getUsers(String keyword, Role role, UserStatus status, Pageable pageable) {
        Page<User> userPage = userRepository.findAll(keyword, role, status, pageable);

        List<ManagerUserResponse> data = userPage.stream()
                .map(userMapper::mapToManagerResponse)
                .toList();

        return PageResponse.<ManagerUserResponse>builder()
                .data(data)
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .build();
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public BlockUserResponse blockUser(Long userId, BlockUserRequest request) {
        Instant now = Instant.now();
        int rowsAffected = userRepository.updateStatus(userId, UserStatus.BLOCKED, now);

        if (rowsAffected > 0) {
            trackingService.blockTracking(userId, request);
        } else {
            log.info("User {} already blocked", userId);
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        return BlockUserResponse.builder()
                .build();
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public BlockUserResponse unblockUser(Long userId, BlockUserRequest request) {
        Instant now = Instant.now();
        int rowsAffected = userRepository.updateStatus(userId, UserStatus.ACTIVE, now);

        if (rowsAffected > 0) {
            trackingService.blockTracking(userId, request);
        } else {
            log.info("User {} already active", userId);
            throw new AppException(ErrorCode.USER_ACTIVE);
        }

        return BlockUserResponse.builder()
                .build();
    }
}

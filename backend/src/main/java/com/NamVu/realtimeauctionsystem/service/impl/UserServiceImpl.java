package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.user.BlockUserRequest;
import com.NamVu.realtimeauctionsystem.dto.user.BlockUserResponse;
import com.NamVu.realtimeauctionsystem.dto.user.ManagerUserResponse;
import com.NamVu.realtimeauctionsystem.dto.common.PageResponse;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.Role;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.mapper.UserMapper;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.UserService;
import com.NamVu.realtimeauctionsystem.service.UserAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final UserAuditService auditService;

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
        userRepository.updateStatus(userId, UserStatus.BLOCKED, now);

        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String blockedBy = jwt.getSubject();

        return BlockUserResponse.builder()
                .userId(userId)
                .status(UserStatus.BLOCKED)
                .by(blockedBy)
                .reason(request.getReason())
                .timestamp(now)
                .build();
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public BlockUserResponse unblockUser(Long userId, BlockUserRequest request) {
        Instant now = Instant.now();
        userRepository.updateStatus(userId, UserStatus.ACTIVE, now);

        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String unblockedBy = jwt.getSubject();

        return BlockUserResponse.builder()
                .userId(userId)
                .status(UserStatus.ACTIVE)
                .by(unblockedBy)
                .reason(request.getReason())
                .timestamp(now)
                .build();
    }
}

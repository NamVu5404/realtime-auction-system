package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.user.BlockUserRequest;
import com.namvu.realtimeauctionsystem.dto.user.BlockUserResponse;
import com.namvu.realtimeauctionsystem.dto.user.ManagerUserResponse;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.Role;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
import com.namvu.realtimeauctionsystem.mapper.UserMapper;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.service.UserService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
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

        String blockedBy = SecurityUtils.getCurrentUserEmail();

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

        String unblockedBy = SecurityUtils.getCurrentUserEmail();

        return BlockUserResponse.builder()
                .userId(userId)
                .status(UserStatus.ACTIVE)
                .by(unblockedBy)
                .reason(request.getReason())
                .timestamp(now)
                .build();
    }
}

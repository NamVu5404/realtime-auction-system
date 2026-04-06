package com.namvu.realtimeauctionsystem.modules.user.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role;
import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.constant.OwnerType;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.file.service.FileService;
import com.namvu.realtimeauctionsystem.modules.user.dto.*;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.mapper.UserMapper;
import com.namvu.realtimeauctionsystem.modules.user.repository.UserRepository;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final FileService fileService;

    @Override
    @Transactional(readOnly = true)
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

    @Override
    public UserResponse updateProfile(UpdateUserRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user = userRepository.save(user);

        return userMapper.mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateAvatar(MultipartFile file) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Xóa avatar cũ
        if (user.getAvatarUrl() != null) {
            fileService.deleteUserAvatarIfExists(userId);
        }

        // Upload
        FileResponse fileResponse = fileService.uploadFile(file, OwnerType.USER_AVATAR, userId, true, 0);

        user.setAvatarUrl(fileResponse.storageName());
        user = userRepository.save(user);

        return userMapper.mapToResponse(user);
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User getUserReference(Long userId) {
        return userRepository.getReferenceById(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public User getActiveUserById(Long userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public User getActiveUserByEmail(String email) {
        return userRepository.findByEmailAndStatus(email, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public UserResponse upgradeToSeller(Long userId) {
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getRoles().contains(Role.SELLER)) {
            throw new AppException(ErrorCode.USER_ALREADY_SELLER);
        }

        user.getRoles().add(Role.SELLER);
        user = userRepository.save(user);

        return userMapper.mapToResponse(user);
    }
}

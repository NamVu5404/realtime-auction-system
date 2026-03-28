package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.user.*;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.enums.Role;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    PageResponse<ManagerUserResponse> getUsers(String keyword, Role role, UserStatus status, Pageable pageable);

    BlockUserResponse blockUser(Long userId, BlockUserRequest request);

    BlockUserResponse unblockUser(Long userId, BlockUserRequest request);

    UserResponse updateProfile(UpdateUserRequest request);

    UserResponse updateAvatar(MultipartFile file);

    UserResponse upgradeToSeller(Long userId);
}

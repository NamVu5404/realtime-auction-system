package com.namvu.realtimeauctionsystem.modules.user.service;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role;
import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.*;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    PageResponse<ManagerUserResponse> getUsers(String keyword, Role role, UserStatus status, Pageable pageable);

    BlockUserResponse blockUser(Long userId, BlockUserRequest request);

    BlockUserResponse unblockUser(Long userId, BlockUserRequest request);

    UserResponse updateProfile(UpdateUserRequest request);

    UserResponse updateAvatar(MultipartFile file);

    UserResponse upgradeToSeller(Long userId);

    User getActiveUserByEmail(String email);

    User getActiveUserById(Long userId);

    User saveUser(User user);

    User getUserReference(Long userId);
}

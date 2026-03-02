package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.user.BlockUserRequest;
import com.namvu.realtimeauctionsystem.dto.user.BlockUserResponse;
import com.namvu.realtimeauctionsystem.dto.user.ManagerUserResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.enums.Role;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
import org.springframework.data.domain.Pageable;

public interface UserService {
    PageResponse<ManagerUserResponse> getUsers(String keyword, Role role, UserStatus status, Pageable pageable);

    BlockUserResponse blockUser(Long userId, BlockUserRequest request);

    BlockUserResponse unblockUser(Long userId, BlockUserRequest request);
}

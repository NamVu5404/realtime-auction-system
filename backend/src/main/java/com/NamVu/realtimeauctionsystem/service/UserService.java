package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.request.BlockUserRequest;
import com.NamVu.realtimeauctionsystem.dto.response.BlockUserResponse;
import com.NamVu.realtimeauctionsystem.dto.response.ManagerUserResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.enums.Role;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import org.springframework.data.domain.Pageable;

public interface UserService {
    PageResponse<ManagerUserResponse> getUsers(String keyword, Role role, UserStatus status, Pageable pageable);

    BlockUserResponse blockUser(Long userId, BlockUserRequest request);

    BlockUserResponse unblockUser(Long userId, BlockUserRequest request);
}

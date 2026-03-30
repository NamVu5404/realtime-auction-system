package com.namvu.realtimeauctionsystem.modules.user.mapper;

import com.namvu.realtimeauctionsystem.modules.user.dto.ManagerUserResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    ManagerUserResponse mapToManagerResponse(User user);

    UserResponse mapToResponse(User user);
}

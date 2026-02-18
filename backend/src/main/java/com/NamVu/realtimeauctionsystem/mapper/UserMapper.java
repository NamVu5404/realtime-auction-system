package com.NamVu.realtimeauctionsystem.mapper;

import com.NamVu.realtimeauctionsystem.dto.user.ManagerUserResponse;
import com.NamVu.realtimeauctionsystem.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    ManagerUserResponse mapToManagerResponse(User user);
}

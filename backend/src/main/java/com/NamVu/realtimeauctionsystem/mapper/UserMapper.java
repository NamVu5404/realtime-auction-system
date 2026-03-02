package com.namvu.realtimeauctionsystem.mapper;

import com.namvu.realtimeauctionsystem.dto.user.ManagerUserResponse;
import com.namvu.realtimeauctionsystem.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    ManagerUserResponse mapToManagerResponse(User user);
}

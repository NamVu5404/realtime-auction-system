package com.namvu.realtimeauctionsystem.modules.user.mapper;

import com.namvu.realtimeauctionsystem.modules.user.dto.ManagerUserResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "isVerifiedIdentity", expression = "java(user.isVerifiedIdentity())")
    @Mapping(target = "isFaceMatch", source = "faceMatch")
    ManagerUserResponse mapToManagerResponse(User user);

    @Mapping(target = "isVerifiedIdentity", expression = "java(user.isVerifiedIdentity())")
    @Mapping(target = "isFaceMatch", source = "faceMatch")
    UserResponse mapToResponse(User user);
}

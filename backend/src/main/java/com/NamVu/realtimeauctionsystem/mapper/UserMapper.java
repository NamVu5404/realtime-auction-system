package com.namvu.realtimeauctionsystem.mapper;

import com.namvu.realtimeauctionsystem.dto.user.ManagerUserResponse;
import com.namvu.realtimeauctionsystem.dto.user.UserResponse;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.OwnerType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "avatarUrl", source = "avatarUrl", qualifiedByName = "buildAvatarUrl")
    ManagerUserResponse mapToManagerResponse(User user);

    @Mapping(target = "avatarUrl", source = "avatarUrl", qualifiedByName = "buildAvatarUrl")
    UserResponse mapToResponse(User user);

    @Named("buildAvatarUrl")
    default String buildAvatarUrl(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        if (value.startsWith("http") || value.startsWith("data:")) {
            return value;
        }

        return OwnerType.USER_AVATAR.getFolderName() + "/" + value;
    }
}

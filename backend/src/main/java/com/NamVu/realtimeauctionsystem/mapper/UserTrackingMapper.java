package com.NamVu.realtimeauctionsystem.mapper;

import com.NamVu.realtimeauctionsystem.dto.response.UserTrackingResponse;
import com.NamVu.realtimeauctionsystem.entity.UserTracking;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserTrackingMapper {
    UserTrackingResponse mapToResponse(UserTracking userTracking);
}

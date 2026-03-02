package com.namvu.realtimeauctionsystem.mapper;

import com.namvu.realtimeauctionsystem.dto.user.UserAuditResponse;
import com.namvu.realtimeauctionsystem.entity.UserAudit;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserAuditMapper {
    UserAuditResponse mapToResponse(UserAudit userAudit);
}

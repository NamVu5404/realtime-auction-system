package com.namvu.realtimeauctionsystem.modules.user.mapper;

import com.namvu.realtimeauctionsystem.modules.user.dto.UserAuditResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.UserAudit;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserAuditMapper {
    UserAuditResponse mapToResponse(UserAudit userAudit);
}

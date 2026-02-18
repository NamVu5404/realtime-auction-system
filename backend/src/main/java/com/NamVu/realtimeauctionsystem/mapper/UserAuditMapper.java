package com.NamVu.realtimeauctionsystem.mapper;

import com.NamVu.realtimeauctionsystem.dto.user.UserAuditResponse;
import com.NamVu.realtimeauctionsystem.entity.UserAudit;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserAuditMapper {
    UserAuditResponse mapToResponse(UserAudit userAudit);
}

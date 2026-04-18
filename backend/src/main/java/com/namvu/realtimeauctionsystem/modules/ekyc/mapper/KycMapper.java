package com.namvu.realtimeauctionsystem.modules.ekyc.mapper;

import com.namvu.realtimeauctionsystem.modules.ekyc.dto.KycResponse;
import com.namvu.realtimeauctionsystem.modules.ekyc.entity.KycVerification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface KycMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(target = "frontImageUrl", ignore = true)
    @Mapping(target = "backImageUrl", ignore = true)
    @Mapping(target = "faceMatchUrl", ignore = true)
    KycResponse mapToResponse(KycVerification kycVerification);
}

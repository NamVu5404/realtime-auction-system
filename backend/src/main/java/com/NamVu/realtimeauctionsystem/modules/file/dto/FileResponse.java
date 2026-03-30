package com.namvu.realtimeauctionsystem.modules.file.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FileResponse(
        Long id,
        String filePath,
        String storageName,
        Long ownerId,
        Integer sortOrder,

        @JsonProperty("isPrimary")
        Boolean isPrimary
) {
}

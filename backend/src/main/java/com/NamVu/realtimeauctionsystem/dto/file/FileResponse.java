package com.namvu.realtimeauctionsystem.dto.file;

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

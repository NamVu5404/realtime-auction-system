package com.NamVu.realtimeauctionsystem.dto.file;

public record FileResponse(
        Long id,
        String filePath,
        String storageName,
        Long ownerId,
        Integer sortOrder,
        Boolean isPrimary
) {
}

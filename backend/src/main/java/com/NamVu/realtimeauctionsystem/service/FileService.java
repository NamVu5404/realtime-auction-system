package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.file.FileResponse;
import com.NamVu.realtimeauctionsystem.enums.OwnerType;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {
    FileResponse uploadFile(MultipartFile file, OwnerType ownerType, Long ownerId, Boolean isPrimary, Integer sortOrder);
}

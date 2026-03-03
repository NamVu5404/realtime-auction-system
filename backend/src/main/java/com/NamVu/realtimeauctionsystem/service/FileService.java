package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.file.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.dto.file.FileResponse;
import com.namvu.realtimeauctionsystem.enums.OwnerType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileService {
    FileResponse uploadFile(MultipartFile file, OwnerType ownerType, Long ownerId, Boolean isPrimary, Integer sortOrder);

    void updateMetadataBatch(List<FileMetadataRequest> requests);

    void deleteFile(Long id);
}

package com.namvu.realtimeauctionsystem.modules.file.service;

import com.namvu.realtimeauctionsystem.modules.file.dto.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.common.constant.OwnerType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileService {
    FileResponse uploadFile(MultipartFile file, OwnerType ownerType, Long ownerId, Boolean isPrimary, Integer sortOrder);

    void updateMetadataBatch(List<FileMetadataRequest> requests);

    void deleteFile(Long id);

    List<FileResponse> getAuctionImages(List<Long> auctionIds);

    void deleteUserAvatarIfExists(Long userId);
}

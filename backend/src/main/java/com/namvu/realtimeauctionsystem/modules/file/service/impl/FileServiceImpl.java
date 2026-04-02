package com.namvu.realtimeauctionsystem.modules.file.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.OwnerType;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.file.entity.File;
import com.namvu.realtimeauctionsystem.modules.file.repository.FileRepository;
import com.namvu.realtimeauctionsystem.modules.file.service.FileService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileServiceImpl implements FileService {

    private final FileRepository fileRepository;
    private final EntityManager entityManager;
    private final ApplicationContext applicationContext;

    private FileService self() {
        return applicationContext.getBean(FileService.class);
    }

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Value("${app.file.max-size}")
    private long maxSize;

    @Value("${app.file.allowed-types}")
    private List<String> allowedTypes;

    @Override
    @Transactional
    public FileResponse uploadFile(MultipartFile file, OwnerType ownerType, Long ownerId, Boolean isPrimary, Integer sortOrder) {
        validateFile(file);

        if (Boolean.TRUE.equals(isPrimary)) {
            fileRepository.resetPrimaryStatus(ownerType, ownerId);
        }

        try {
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String storageName = UUID.randomUUID() + "_" + ownerType + "_" + ownerId + "." + extension;
            String relativePath = ownerType.getFolderName();

            Path targetDir = Paths.get(uploadDir).resolve(relativePath);
            if (!Files.exists(targetDir)) Files.createDirectories(targetDir);

            Files.copy(file.getInputStream(), targetDir.resolve(storageName), StandardCopyOption.REPLACE_EXISTING);

            File entity = File.builder()
                    .fileName(file.getOriginalFilename())
                    .storageName(storageName)
                    .filePath(relativePath)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .ownerType(ownerType)
                    .ownerId(ownerId)
                    .isPrimary(isPrimary != null && isPrimary)
                    .sortOrder(sortOrder != null ? sortOrder : 0)
                    .build();

            entity = fileRepository.save(entity);
            return mapToResponse(entity);

        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_ERROR);
        }
    }

    @Override
    @Transactional
    public void updateMetadataBatch(List<FileMetadataRequest> requests) {
        if (requests == null || requests.isEmpty()) return;

        boolean hasNewPrimary = requests.stream()
                .anyMatch(r -> Boolean.TRUE.equals(r.getIsPrimary()));

        if (hasNewPrimary) {
            File firstFile = fileRepository.findById(requests.getFirst().getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

            fileRepository.resetPrimaryStatus(firstFile.getOwnerType(), firstFile.getOwnerId());
            entityManager.flush();
        }

        for (FileMetadataRequest request : requests) {
            File file = fileRepository.findById(request.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

            if (request.getIsPrimary() != null) {
                file.setPrimary(request.getIsPrimary());
            }
            if (request.getSortOrder() != null) {
                file.setSortOrder(request.getSortOrder());
            }
            fileRepository.save(file);
        }
        log.info("Updated metadata for {} files", requests.size());
    }

    @Override
    @Transactional
    public void deleteFile(Long id) {
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        try {
            Path filePath = Paths.get(uploadDir).resolve(file.getFilePath()).resolve(file.getStorageName());
            Files.deleteIfExists(filePath);
            fileRepository.delete(file);

            log.info("Deleted file id: {}, storageName: {}", id, file.getStorageName());
        } catch (IOException e) {
            log.error("Failed to delete physical file: {}", file.getStorageName(), e);
            throw new AppException(ErrorCode.FILE_DELETE_ERROR);
        }
    }

    @Override
    public List<FileResponse> getAuctionImages(List<Long> auctionIds) {
        if (auctionIds == null || auctionIds.isEmpty()) return List.of();
        return fileRepository.findAllByOwnerTypeAndIds(OwnerType.AUCTION_IMAGE, auctionIds);
    }

    @Override
    @Transactional
    public void deleteUserAvatarIfExists(Long userId) {
        fileRepository.findByOwnerTypeAndOwnerId(OwnerType.USER_AVATAR, userId)
                .ifPresent(f -> self().deleteFile(f.getId()));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        if (file.getSize() > maxSize) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }

        if (!allowedTypes.contains(file.getContentType())) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }
    }

    private FileResponse mapToResponse(File entity) {
        return new FileResponse(entity.getId(), entity.getFilePath(), entity.getStorageName(),
                entity.getOwnerId(), entity.getSortOrder(), entity.isPrimary());
    }
}

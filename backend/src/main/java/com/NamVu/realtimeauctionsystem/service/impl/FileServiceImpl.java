package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.file.FileResponse;
import com.NamVu.realtimeauctionsystem.entity.File;
import com.NamVu.realtimeauctionsystem.enums.OwnerType;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.FileRepository;
import com.NamVu.realtimeauctionsystem.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
            String storageName = UUID.randomUUID() + "." + extension;
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

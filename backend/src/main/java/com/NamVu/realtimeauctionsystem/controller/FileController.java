package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.dto.file.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.dto.file.FileResponse;
import com.namvu.realtimeauctionsystem.enums.OwnerType;
import com.namvu.realtimeauctionsystem.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerType") OwnerType ownerType,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "isPrimary", required = false) Boolean isPrimary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) {

        return ApiResponse.<FileResponse>builder()
                .result(fileService.uploadFile(file, ownerType, ownerId, isPrimary, sortOrder))
                .build();
    }

    @PatchMapping("/metadata/batch")
    public ApiResponse<Void> updateMetadataBatch(@RequestBody List<FileMetadataRequest> requests) {
        fileService.updateMetadataBatch(requests);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        fileService.deleteFile(id);
        return ApiResponse.<Void>builder().build();
    }
}

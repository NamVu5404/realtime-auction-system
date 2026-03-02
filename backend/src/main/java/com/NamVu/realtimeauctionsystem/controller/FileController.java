package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.file.FileResponse;
import com.namvu.realtimeauctionsystem.enums.OwnerType;
import com.namvu.realtimeauctionsystem.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerType") OwnerType ownerType,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "isPrimary", required = false) Boolean isPrimary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) {

        return ResponseEntity.ok(fileService.uploadFile(file, ownerType, ownerId, isPrimary, sortOrder));
    }
}

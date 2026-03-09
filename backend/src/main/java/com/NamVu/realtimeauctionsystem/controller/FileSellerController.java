package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.dto.file.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.dto.file.FileResponse;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.enums.AuctionStatus;
import com.namvu.realtimeauctionsystem.enums.OwnerType;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.service.FileService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/v1/files/seller")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
public class FileSellerController {

    private final FileService fileService;
    private final AuctionRepository auctionRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "isPrimary", required = false) Boolean isPrimary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) {

        checkAuctionStatusAndFileOwnership(ownerId);

        return ApiResponse.<FileResponse>builder()
                .result(fileService.uploadFile(file, OwnerType.AUCTION_IMAGE, ownerId, isPrimary, sortOrder))
                .build();
    }

    @PatchMapping("/metadata/batch")
    public ApiResponse<Void> updateMetadataBatch(
            @RequestParam("ownerId") Long ownerId,
            @RequestBody List<FileMetadataRequest> requests) {
        checkAuctionStatusAndFileOwnership(ownerId);
        fileService.updateMetadataBatch(requests);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @RequestParam("ownerId") Long ownerId) {
        checkAuctionStatusAndFileOwnership(ownerId);
        fileService.deleteFile(id);
        return ApiResponse.<Void>builder().build();
    }

    private void checkAuctionStatusAndFileOwnership(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        if (auction.getStatus() != AuctionStatus.DRAFT && auction.getStatus() != AuctionStatus.SCHEDULED) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!auction.getSeller().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
        }
    }
}

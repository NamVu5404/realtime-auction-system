package com.namvu.realtimeauctionsystem.modules.file.controller;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionImageService;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/files/seller")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
public class FileAuctionController {

    private final AuctionImageService auctionImageService;
    private final AuctionService auctionService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "isPrimary", required = false) Boolean isPrimary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) {

        checkAuctionStatusAndFileOwnership(ownerId);
        return ApiResponse.of(FILE_UPLOADED, auctionImageService.uploadAuctionImage(file, ownerId, isPrimary, sortOrder));
    }

    @PatchMapping("/metadata/batch")
    public ApiResponse<Void> updateMetadataBatch(
            @RequestParam("ownerId") Long ownerId,
            @RequestBody(required = false) List<FileMetadataRequest> requests) {
        checkAuctionStatusAndFileOwnership(ownerId);
        if (requests != null && !requests.isEmpty()) {
            auctionImageService.updateAuctionImageMetadataBatch(ownerId, requests);
        }
        return ApiResponse.of(UPDATED, null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @RequestParam("ownerId") Long ownerId) {
        checkAuctionStatusAndFileOwnership(ownerId);
        auctionImageService.deleteAuctionImage(id, ownerId);
        return ApiResponse.of(FILE_DELETED, null);
    }

    private void checkAuctionStatusAndFileOwnership(Long auctionId) {
        Auction auction = auctionService.getAuctionDetailById(auctionId);

        if (auction.getStatus() != AuctionStatus.DRAFT && auction.getStatus() != AuctionStatus.SCHEDULED) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!auction.getSeller().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
        }
    }
}

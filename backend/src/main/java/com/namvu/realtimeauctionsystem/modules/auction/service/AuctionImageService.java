package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.modules.file.dto.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AuctionImageService {
    List<FileResponse> getAuctionImages(List<Long> auctionIds);

    FileResponse uploadAuctionImage(MultipartFile file, Long auctionId, Boolean isPrimary, Integer sortOrder);

    void updateAuctionImageMetadataBatch(Long auctionId, List<FileMetadataRequest> requests);

    void deleteAuctionImage(Long fileId, Long auctionId);

    void evictAuctionImagesCache(Long auctionId);
}
package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.modules.file.dto.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public interface AuctionImageService {
    List<FileResponse> getAuctionImages(List<Long> auctionIds);

    default Map<Long, String> getPrimaryImageMap(List<Long> auctionIds) {
        if (auctionIds.isEmpty()) return Map.of();
        Map<Long, List<FileResponse>> byAuction = getAuctionImages(auctionIds).stream()
                .collect(Collectors.groupingBy(FileResponse::ownerId));
        Map<Long, String> result = new HashMap<>();
        byAuction.forEach((auctionId, images) -> images.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .findFirst()
                .or(() -> images.stream().findFirst())
                .ifPresent(img -> result.put(auctionId, img.filePath() + "/" + img.storageName())));
        return result;
    }

    FileResponse uploadAuctionImage(MultipartFile file, Long auctionId, Boolean isPrimary, Integer sortOrder);

    void updateAuctionImageMetadataBatch(Long auctionId, List<FileMetadataRequest> requests);

    void deleteAuctionImage(Long fileId, Long auctionId);

    void evictAuctionImagesCache(Long auctionId);
}
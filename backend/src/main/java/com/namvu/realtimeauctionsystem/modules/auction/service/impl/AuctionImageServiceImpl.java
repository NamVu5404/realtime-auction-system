package com.namvu.realtimeauctionsystem.modules.auction.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.OwnerType;
import com.namvu.realtimeauctionsystem.common.constant.CacheNameConstant;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionImageService;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileMetadataRequest;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuctionImageServiceImpl implements AuctionImageService {
    private final FileService fileService;
    private final CacheManager cacheManager;

    /**
     * Lấy danh sách ảnh của các auction.
     * <p>
     * Hàm này áp dụng chiến lược caching granular (cache theo từng auction ID):
     * - Kiểm tra cache để lấy ảnh đã được lưu
     * - Chỉ gọi DB cho các auction ID chưa được cache
     * - Cache các kết quả mới trước khi trả về
     * <p>
     * Lợi ích: Giảm số lần truy cập DB, tránh evict toàn bộ cache khi 1 auction thay đổi
     *
     * @param auctionIds danh sách ID của các auction cần lấy ảnh
     * @return danh sách FileResponse chứa thông tin ảnh của các auction
     */
    @Override
    @Transactional(readOnly = true)
    public List<FileResponse> getAuctionImages(List<Long> auctionIds) {
        if (auctionIds == null || auctionIds.isEmpty()) return List.of();

        Cache cache = cacheManager.getCache(CacheNameConstant.AUCTION_IMAGES);
        Set<Long> uniqueAuctionIds = new LinkedHashSet<>(auctionIds);
        List<Long> missingAuctionIds = new ArrayList<>();
        List<FileResponse> images = new ArrayList<>();

        for (Long auctionId : uniqueAuctionIds) {
            Optional<List<FileResponse>> cachedImages = getCachedAuctionImages(cache, auctionId);
            if (cachedImages.isPresent()) {
                images.addAll(cachedImages.get());
                continue;
            }
            missingAuctionIds.add(auctionId);
        }

        images.addAll(loadAndCacheAuctionImages(cache, missingAuctionIds));
        return images;
    }

    /**
     * Upload ảnh mới cho một auction.
     * <p>
     * Luồng xử lý:
     * 1. Gọi FileService để lưu file lên storage
     * 2. Xóa cache của auction này để bắt buộc reload ảnh mới từ DB lần tới
     * 3. Trả về thông tin file đã upload
     *
     * @param file      file ảnh từ request
     * @param auctionId ID của auction
     * @param isPrimary có phải ảnh chính không
     * @param sortOrder thứ tự sắp xếp ảnh
     * @return FileResponse chứa thông tin file đã upload
     */
    @Override
    @Transactional
    public FileResponse uploadAuctionImage(MultipartFile file, Long auctionId, Boolean isPrimary, Integer sortOrder) {
        FileResponse response = fileService.uploadFile(file, OwnerType.AUCTION_IMAGE, auctionId, isPrimary, sortOrder);
        evictAuctionImagesCache(auctionId);
        return response;
    }

    /**
     * Cập nhật metadata (ví dụ: isPrimary, sortOrder) cho nhiều ảnh của 1 auction.
     * <p>
     * Luồng xử lý:
     * 1. Gọi FileService để cập nhật thông tin ảnh trong DB
     * 2. Xóa cache của auction này vì dữ liệu đã thay đổi
     * 3. Lần truy cập tiếp theo sẽ tải ảnh mới từ DB
     *
     * @param auctionId ID của auction chứa các ảnh cần cập nhật
     * @param requests  danh sách yêu cầu cập nhật metadata ảnh
     */
    @Override
    @Transactional
    public void updateAuctionImageMetadataBatch(Long auctionId, List<FileMetadataRequest> requests) {
        fileService.updateMetadataBatch(requests);
        evictAuctionImagesCache(auctionId);
    }

    /**
     * Xóa một ảnh của auction.
     * <p>
     * Luồng xử lý:
     * 1. Gọi FileService để xóa file khỏi storage và DB
     * 2. Xóa cache của auction này vì danh sách ảnh đã thay đổi
     * 3. Lần truy cập tiếp theo sẽ tải danh sách ảnh mới (không bao gồm ảnh bị xóa)
     *
     * @param fileId    ID của file ảnh cần xóa
     * @param auctionId ID của auction chứa ảnh
     */
    @Override
    @Transactional
    public void deleteAuctionImage(Long fileId, Long auctionId) {
        fileService.deleteFile(fileId);
        evictAuctionImagesCache(auctionId);
    }

    /**
     * Xóa cache ảnh của một auction cụ thể.
     * <p>
     * Mục đích: Sau khi thêm/sửa/xóa ảnh, ta cần xóa cache để ngăn chặn dữ liệu cũ.
     * <p>
     * Cách thức:
     * - Lấy cache name từ CacheNameConstant.AUCTION_IMAGES
     * - Xóa entry với key = auctionId
     * - Lần gọi getAuctionImages tiếp theo sẽ phải query DB lại
     *
     * @param auctionId ID của auction, nếu null thì không làm gì
     */
    @Override
    public void evictAuctionImagesCache(Long auctionId) {
        if (auctionId == null) return;
        Cache cache = cacheManager.getCache(CacheNameConstant.AUCTION_IMAGES);
        if (cache != null) {
            cache.evict(auctionId);
        }
    }

    /**
     * Lấy ảnh của một auction từ cache.
     * <p>
     * Hàm private này được dùng bên trong getAuctionImages().
     * <p>
     * Logic:
     * - Kiểm tra xem cache có tồn tại không
     * - Lấy entry từ cache với key = auctionId
     * - Nếu tồn tại, ép kiểu về List<FileResponse> và trả về
     * - Nếu không, trả về Optional.empty()
     *
     * @param cache     đối tượng Cache từ CacheManager
     * @param auctionId ID của auction
     * @return Optional chứa List<FileResponse> nếu có, hoặc empty nếu không
     */
    private Optional<List<FileResponse>> getCachedAuctionImages(Cache cache, Long auctionId) {
        if (cache == null || auctionId == null) {
            return Optional.empty();
        }

        try {
            Cache.ValueWrapper cached = cache.get(auctionId);
            if (cached == null) {
                return Optional.empty();
            }

            @SuppressWarnings("unchecked")
            List<FileResponse> cachedImages = (List<FileResponse>) cached.get();
            return Optional.ofNullable(cachedImages);
        } catch (Exception ex) {
            cache.evict(auctionId);
            return Optional.empty();
        }
    }

    /**
     * Lấy ảnh từ DB cho các auction chưa cache và lưu vào cache.
     * <p>
     * Hàm private này được dùng bên trong getAuctionImages() cho các auction ID chưa có cache.
     * <p>
     * Logic:
     * 1. Nếu danh sách auctionIds rỗng, trả về List.of()
     * 2. Gọi FileService.getAuctionImages() để lấy ảnh từ DB
     * 3. Nhóm các ảnh theo auctionId (vì 1 auction có thể có nhiều ảnh)
     * 4. Với mỗi auctionId, lưu danh sách ảnh của nó vào cache
     * 5. Trả về tất cả ảnh đã load
     * <p>
     * Lợi ích: Sau lần load này, lần tiếp theo getAuctionImages sẽ lấy từ cache
     *
     * @param cache      đối tượng Cache từ CacheManager
     * @param auctionIds danh sách ID của auction cần load từ DB
     * @return danh sách FileResponse của tất cả các auction
     */
    private List<FileResponse> loadAndCacheAuctionImages(Cache cache, List<Long> auctionIds) {
        if (auctionIds == null || auctionIds.isEmpty()) {
            return List.of();
        }

        List<FileResponse> loadedImages = fileService.getAuctionImages(auctionIds);
        if (cache == null) {
            return loadedImages;
        }

        Map<Long, List<FileResponse>> imagesByAuctionId = loadedImages.stream()
                .collect(Collectors.groupingBy(FileResponse::ownerId));
        List<FileResponse> result = new ArrayList<>();

        for (Long auctionId : auctionIds) {
            // Luon cache bang ArrayList de serializer co type metadata on dinh, ke ca khi rong.
            List<FileResponse> perAuctionImages = new ArrayList<>(imagesByAuctionId.getOrDefault(auctionId, Collections.emptyList()));
            cache.put(auctionId, perAuctionImages);
            result.addAll(perAuctionImages);
        }
        return result;
    }
}
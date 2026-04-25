package com.namvu.realtimeauctionsystem.modules.auction.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.constant.CacheNameConstant;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.dto.*;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.mapper.AuctionMapper;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionImageService;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateMessage;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidRequestV1;
import com.namvu.realtimeauctionsystem.modules.bid.dto.PlaceBidResponse;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidQueryService;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import com.namvu.realtimeauctionsystem.modules.wishlist.service.WishListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.WebSocketDestination.AUCTION_TOPIC_PREFIX;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionServiceImpl implements AuctionService {

    private final AuctionRepository auctionRepository;
    private final AuctionMapper auctionMapper;
    private final UserService userService;
    private final RedisAuctionService redisAuctionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuctionImageService auctionImageService;
    private final BidQueryService bidQueryService;
    private final NotificationService notificationService;

    // @Lazy breaks the circular dependency: AuctionService <-> WishListService
    @Lazy
    @Autowired
    private WishListService wishListService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNameConstant.AUCTIONS, key = "#status.name() + '-' + #pageable.pageNumber")
    public PageResponse<AuctionResponse> getAuctionsByStatus(AuctionStatus status, Pageable pageable) {
        Instant oneHourFromNow = Instant.now().plus(1, ChronoUnit.HOURS);

        Page<Auction> auctionPage = auctionRepository.findByCustomStatus(status, oneHourFromNow, pageable);

        return getResponse(pageable, auctionPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionResponse getAuctionDetail(Long id, String token) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        canViewAuction(auction, token);

        AuctionResponse response = auctionMapper.mapToResponse(auction);
        response.setImages(auctionImageService.getAuctionImages(List.of(id)));
        populateImages(response);

        return response;
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
    public AuctionResponse saveDraft(CreateAuctionRequest request) {
        Auction auction = auctionMapper.mapToEntity(request);
        auction.setStatus(AuctionStatus.DRAFT);

        Long sellerId = SecurityUtils.getCurrentUserId();
        auction.setSeller(userService.getUserReference(sellerId));

        handlePrivateAuction(auction);
        auction = auctionRepository.save(auction);
        AuctionResponse response = auctionMapper.mapToResponse(auction);
        populateImages(response);
        return response;
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
    @CacheEvict(value = CacheNameConstant.AUCTIONS, allEntries = true)
    public AuctionResponse scheduleAuction(CreateAuctionRequest request) {
        Instant now = Instant.now();
        Instant startTime = request.getStartTime();
        Instant endTime = request.getEndTime();

        if (startTime.isBefore(now.plusMillis(1)) || endTime.isBefore(startTime)) {
            throw new AppException(ErrorCode.START_END_TIME_INVALID);
        }

        if (request.getReservePrice() != null && request.getReservePrice().compareTo(request.getStartPrice()) < 0) {
            throw new AppException(ErrorCode.RESERVE_PRICE_INVALID);
        }

        Auction auction;

        if (request.getId() != null) {
            auction = auctionRepository.findById(request.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

            if (auction.getStatus() != null && auction.getStatus() != AuctionStatus.DRAFT) {
                throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
            }

            checkAuctionOwnership(auction);

            auctionMapper.updateEntity(request, auction);
        } else {
            auction = auctionMapper.mapToEntity(request);
        }

        auction.setStatus(AuctionStatus.SCHEDULED);
        auction.setCurrentPrice(auction.getStartPrice());

        if (auction.getSeller() == null) {
            Long sellerId = SecurityUtils.getCurrentUserId();
            auction.setSeller(userService.getUserReference(sellerId));
        }

        handlePrivateAuction(auction);
        auction = auctionRepository.save(auction);
        AuctionResponse response = auctionMapper.mapToResponse(auction);
        populateImages(response);
        return response;
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
    public AuctionResponse updateDraftAuction(Long id, UpdateDraftAuctionRequest request) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        if (auction.getStatus() != AuctionStatus.DRAFT) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        checkAuctionOwnership(auction);

        auctionMapper.updateEntity(request, auction);
        handlePrivateAuction(auction);
        auction = auctionRepository.save(auction);

        AuctionResponse response = auctionMapper.mapToResponse(auction);
        populateImages(response);
        return response;
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
    @CacheEvict(value = CacheNameConstant.AUCTIONS, allEntries = true)
    public AuctionResponse updateScheduledAuction(Long id, UpdateScheduledAuctionRequest request) {
        Instant now = Instant.now();
        Instant startTime = request.getStartTime();
        Instant endTime = request.getEndTime();

        if (startTime.isBefore(now.plusMillis(1)) || endTime.isBefore(startTime)) {
            throw new AppException(ErrorCode.START_END_TIME_INVALID);
        }

        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        if (auction.getStatus() != AuctionStatus.SCHEDULED) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        if (request.getReservePrice() != null && request.getReservePrice().compareTo(auction.getStartPrice()) < 0) {
            throw new AppException(ErrorCode.RESERVE_PRICE_INVALID);
        }

        checkAuctionOwnership(auction);

        auctionMapper.updateEntity(request, auction);
        handlePrivateAuction(auction);
        auction = auctionRepository.save(auction);

        AuctionResponse response = auctionMapper.mapToResponse(auction);
        populateImages(response);
        return response;
    }

    @Override
    @PreAuthorize("hasAuthority('SELLER')")
    public AuctionResponse relistAuction(Long auctionId) {
        Auction auction = getAuctionDetailById(auctionId);
        checkAuctionOwnership(auction);

        if (auction.getStatus() != AuctionStatus.ENDED_NO_SALE) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        Auction newAuction = auctionMapper.cloneToNewDraft(auction);
        newAuction.setStatus(AuctionStatus.DRAFT);
        newAuction.setExtensionCount(0);
        newAuction.setNotifiedEndingSoon(false);
        newAuction = auctionRepository.save(newAuction);

        return auctionMapper.mapToResponse(newAuction);
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
    @CacheEvict(value = CacheNameConstant.AUCTIONS, allEntries = true)
    public CancelAuctionResponse cancelAuction(Long id, CancelAuctionRequest request) {
        Auction auction = auctionRepository.findByIdWithLock(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        if (auction.getStatus() != AuctionStatus.DRAFT && auction.getStatus() != AuctionStatus.SCHEDULED) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        if (auction.getStatus() == AuctionStatus.SCHEDULED && auction.getStartTime().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        if (!SecurityUtils.isAdmin()) {
            checkAuctionOwnership(auction);
        }

        auction.setStatus(AuctionStatus.CANCELLED);
        auction = auctionRepository.save(auction);

        notifyWishlistUsersOnCancelled(auction);

        return CancelAuctionResponse.builder()
                .auctionId(auction.getId())
                .by(SecurityUtils.getCurrentUserEmail())
                .timestamp(Instant.now())
                .reason(request.getReason())
                .build();
    }

    private void notifyWishlistUsersOnCancelled(Auction auction) {
        Set<Long> wishlistUserIds = wishListService.getUserIdsByAuctionId(auction.getId());
        if (wishlistUserIds.isEmpty()) return;

        notificationService.processWishlistAuctionCancelledNotifications(
                auction.getId(), auction.getTitle(), wishlistUserIds
        );
    }

    @Override
    public PlaceBidResponse placeBidV1(PlaceBidRequestV1 request) {
        BidUpdateResult result = redisAuctionService
                .updateBidWithLock(request.getAuctionId(), request.getBidderId(), request.getAmount());

        // Push realtime update qua WebSocket
        if (result.isSuccess()) {
            BidUpdateMessage message = BidUpdateMessage.builder()
                    .auctionId(request.getAuctionId())
                    .currentPrice(result.getNewPrice())
                    .highestBidderId(result.getHighestBidderId())
//                    .highestBidderName(name)
                    .timestamp(result.getTimestamp())
                    .extended(result.isExtended())
                    .build();

            messagingTemplate.convertAndSend(
                    AUCTION_TOPIC_PREFIX + request.getAuctionId(),
                    message
            );
        }

        return PlaceBidResponse.builder()
                .success(result.isSuccess())
                .message(result.getMessage())
                .currentPrice(result.getNewPrice())
                .highestBidderId(result.getHighestBidderId())
//                .highestBidderName(name)
                .timestamp(result.getTimestamp())
                .extended(result.isExtended())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('SELLER')")
    public PageResponse<AuctionResponse> filterSellerAuction(String keyword, Instant startTime, Instant endTime,
                                                             AuctionStatus status, Boolean privateMode, Pageable pageable) {
        Long sellerId = SecurityUtils.getCurrentUserId();
        return filterAuction(sellerId, keyword, startTime, endTime, status, privateMode, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<AuctionResponse> filterAdminAuction(String keyword, Instant startTime, Instant endTime,
                                                            AuctionStatus status, Boolean privateMode, Pageable pageable) {
        return filterAuction(null, keyword, startTime, endTime, status, privateMode, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    public PageResponse<AuctionHistoryResponse> getAuctionHistory(Long id, Pageable pageable) {
        if (!SecurityUtils.isAdmin()) {
            Auction auction = getAuctionDetailById(id);
            checkAuctionOwnership(auction);
        }

        Page<Bid> bidPage = bidQueryService.getPagedBidsByAuction(id, pageable);

        List<AuctionHistoryResponse> data = bidPage.stream()
                .map(bid -> {
                    User bidder = bid.getBidder();
                    return AuctionHistoryResponse.builder()
                            .bidderId(bidder.getId())
                            .bidderEmail(bidder.getEmail())
                            .amount(bid.getAmount())
                            .status(bid.getStatus())
                            .timestamp(bid.getCreatedAt())
                            .build();
                })
                .toList();

        return PageResponse.<AuctionHistoryResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(bidPage.getTotalPages())
                .totalElements(bidPage.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    public int applyBid(Long auctionId, BigDecimal newPrice, Long bidderId, Instant finalEndTime, Integer nextExtensionCount) {
        return auctionRepository.updateAuctionPriceAndEndTime(auctionId, newPrice, bidderId, finalEndTime, nextExtensionCount);
    }

    @Override
    public void cancelFutureAuctions(Long userId) {
        auctionRepository.cancelFutureAuctions(userId);
    }

    @Override
    public Auction getAuctionDetailById(Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));
    }

    @Override
    public Auction getAuctionReference(Long auctionId) {
        return auctionRepository.getReferenceById(auctionId);
    }

    @Override
    public Auction saveAuction(Auction auction) {
        return auctionRepository.save(auction);
    }

    @Override
    public void isLiveAuction(Long auctionId) {
        Auction auction = getAuctionDetailById(auctionId);
        if (auction.getStatus() != AuctionStatus.LIVE) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionStateSnapshot getAuctionState(Long auctionId) {
        return redisAuctionService.getAuctionStateFromRedis(auctionId);
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionWinProjection getAuctionWinMetrics(Long bidderId) {
        return auctionRepository.getAuctionWinMetrics(bidderId);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerStatsResponse getSellerStats(Long sellerId, String period) {
        String timeFormat = "WEEK".equalsIgnoreCase(period) ? "%x-W%v" : "%Y-%m";
        Instant startDate = "WEEK".equalsIgnoreCase(period)
                ? Instant.now().minus(30 * 3L, ChronoUnit.DAYS)
                : Instant.now().minus(365, ChronoUnit.DAYS);

        SellerAggregateProjection aggregate = auctionRepository.getSellerAggregateMetrics(sellerId);
        List<SellerChartProjection> chartData = auctionRepository.getSellerRevenueChart(sellerId, startDate, timeFormat);

        Long totalBidsReceived = bidQueryService.countTotalBidsReceivedBySeller(sellerId);
        Long totalUniqueBidders = bidQueryService.countUniqueBiddersBySeller(sellerId);

        return SellerStatsResponse.builder()
                .totalRevenue(aggregate.getTotalRevenue())
                .totalAuctionsCreated(aggregate.getTotalAuctionsCreated())
                .totalAuctionsSold(aggregate.getTotalAuctionsSold())
                .totalAuctionsEnded(aggregate.getEndedAuctions())
                .activeAuctions(aggregate.getActiveAuctions())
                .totalBidsReceived(totalBidsReceived)
                .highestSoldPrice(aggregate.getHighestSoldPrice())
                .totalUniqueBidders(totalUniqueBidders)
                .revenueChart(chartData)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public KpiAuctionProjection getAdminKpiAuctionData() {
        return auctionRepository.getAdminKpiAuctionData();
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionOverviewProjection getAdminAuctionOverviewData() {
        return auctionRepository.getAdminAuctionOverviewData();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RevenueProjection> getAdminRevenueChartData(Instant startDate, String timeFormat) {
        return auctionRepository.getAdminRevenueChartData(startDate, timeFormat);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    public String getAuctionToken(Long id) {
        Auction auction = getAuctionDetailById(id);
        if (!SecurityUtils.isAdmin()) {
            checkAuctionOwnership(auction);
        }
        return auction.getToken();
    }

    private void populateImages(List<AuctionResponse> responses) {
        if (responses.isEmpty()) return;

        List<Long> auctionIds = responses.stream().map(AuctionResponse::getId).toList();
        List<FileResponse> allImages = auctionImageService.getAuctionImages(auctionIds);

        Map<Long, List<FileResponse>> imageMap = allImages.stream()
                .collect(Collectors.groupingBy(FileResponse::ownerId));

        responses.forEach(response -> {
            List<FileResponse> images = imageMap.getOrDefault(response.getId(), List.of());
            response.setImages(images);
            setPrimaryImage(response, images);
        });
    }

    private void populateImages(AuctionResponse response) {
        if (response.getImages() == null || response.getImages().isEmpty()) {
            List<FileResponse> images = auctionImageService.getAuctionImages(List.of(response.getId()));
            response.setImages(images);
        }
        setPrimaryImage(response, response.getImages());
    }

    private void setPrimaryImage(AuctionResponse response, List<FileResponse> images) {
        if (images == null || images.isEmpty()) return;

        images.stream()
                .filter(img -> img.isPrimary() != null && img.isPrimary())
                .findFirst()
                .or(() -> images.stream().findFirst()) // fallback to first image if no primary
                .ifPresent(img -> response.setImage(img.filePath() + "/" + img.storageName()));
    }

    private void checkAuctionOwnership(Auction auction) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!auction.getSeller().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
        }
    }

    private PageResponse<AuctionResponse> filterAuction(Long sellerId, String keyword, Instant startTime, Instant endTime,
                                                        AuctionStatus status, Boolean privateMode, Pageable pageable) {
        String statusStr = (status == null) ? AuctionStatus.ALL.name() : status.name();
        Page<Auction> auctionPage = auctionRepository
                .filterAuctions(keyword, startTime, endTime, status, statusStr, sellerId, privateMode, pageable);
        return getResponse(pageable, auctionPage);
    }

    private PageResponse<AuctionResponse> getResponse(Pageable pageable, Page<Auction> auctionPage) {
        List<AuctionResponse> responses = auctionPage.getContent().stream()
                .map(auctionMapper::mapToResponse)
                .toList();

        populateImages(responses);

        return PageResponse.<AuctionResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(auctionPage.getTotalPages())
                .totalElements(auctionPage.getTotalElements())
                .data(responses)
                .build();
    }

    private void canViewAuction(Auction auction, String token) {
        if (auction.getStatus() != AuctionStatus.DRAFT && auction.getStatus() != AuctionStatus.CANCELLED
                && (!auction.isPrivateMode() || auction.getToken().equals(token))) {
            return;
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isSeller = auction.getSeller().getId().equals(currentUserId);
        boolean isAdmin = SecurityUtils.isAdmin();

        if (!isSeller && !isAdmin) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
        }
    }

    private void handlePrivateAuction(Auction auction) {
        if (auction.isPrivateMode()) {
            auction.setToken(UUID.randomUUID().toString());
        } else {
            auction.setToken(null);
        }
    }
}

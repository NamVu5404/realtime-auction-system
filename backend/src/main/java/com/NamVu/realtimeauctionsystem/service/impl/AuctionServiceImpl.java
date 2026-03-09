package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.auction.*;
import com.namvu.realtimeauctionsystem.dto.bid.BidUpdateMessage;
import com.namvu.realtimeauctionsystem.dto.bid.BidUpdateResult;
import com.namvu.realtimeauctionsystem.dto.bid.PlaceBidRequestV1;
import com.namvu.realtimeauctionsystem.dto.bid.PlaceBidResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.file.FileResponse;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.entity.Bid;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.AuctionStatus;
import com.namvu.realtimeauctionsystem.enums.OwnerType;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.mapper.AuctionMapper;
import com.namvu.realtimeauctionsystem.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.repository.BidRepository;
import com.namvu.realtimeauctionsystem.repository.FileRepository;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.service.AuctionService;
import com.namvu.realtimeauctionsystem.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionServiceImpl implements AuctionService {

    private final AuctionRepository auctionRepository;
    private final AuctionMapper auctionMapper;
    private final UserRepository userRepository;
    private final RedisAuctionService redisAuctionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final BidRepository bidRepository;
    private final FileRepository fileRepository;

    @Override
    public PageResponse<AuctionResponse> getAuctionsByStatus(AuctionStatus status, Pageable pageable) {
        Instant oneHourFromNow = Instant.now().plus(1, ChronoUnit.HOURS);

        Page<Auction> auctionPage = auctionRepository.findByCustomStatus(status, oneHourFromNow, pageable);

        return getResponse(pageable, auctionPage);
    }

    @Override
    public AuctionResponse getAuctionDetail(Long id) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        AuctionResponse response = auctionMapper.mapToResponse(auction);
        response.setImages(fileRepository.findAllByOwnerTypeAndIds(OwnerType.AUCTION_IMAGE, List.of(id)));
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
        auction.setSeller(userRepository.getReferenceById(sellerId));

        auction = auctionRepository.save(auction);
        AuctionResponse response = auctionMapper.mapToResponse(auction);
        populateImages(response);
        return response;
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
    public AuctionResponse scheduleAuction(CreateAuctionRequest request) {
        Instant now = Instant.now();
        Instant startTime = request.getStartTime();
        Instant endTime = request.getEndTime();

        if (startTime.isBefore(now.plusSeconds(30)) || endTime.isBefore(startTime)) {
            throw new AppException(ErrorCode.START_END_TIME_INVALID);
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
            auction.setSeller(userRepository.getReferenceById(sellerId));
        }

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
        auction = auctionRepository.save(auction);

        AuctionResponse response = auctionMapper.mapToResponse(auction);
        populateImages(response);
        return response;
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
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

        checkAuctionOwnership(auction);

        auctionMapper.updateEntity(request, auction);
        auction = auctionRepository.save(auction);

        AuctionResponse response = auctionMapper.mapToResponse(auction);
        populateImages(response);
        return response;
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    @Transactional
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

        return CancelAuctionResponse.builder()
                .auctionId(auction.getId())
                .by(SecurityUtils.getCurrentUserEmail())
                .timestamp(Instant.now())
                .reason(request.getReason())
                .build();
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
                    "/topic/auction/" + request.getAuctionId(),
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
    @PreAuthorize("hasAuthority('SELLER')")
    public PageResponse<AuctionResponse> filterSellerAuction(String keyword, Instant startTime, Instant endTime,
                                                       AuctionStatus status, Pageable pageable) {
        Long sellerId = SecurityUtils.getCurrentUserId();
        return filterAuction(sellerId, keyword, startTime, endTime, status, pageable);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<AuctionResponse> filterAdminAuction(String keyword, Instant startTime, Instant endTime,
                                                             AuctionStatus status, Pageable pageable) {
        return filterAuction(null, keyword, startTime, endTime, status, pageable);
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    public PageResponse<AuctionHistoryResponse> getAuctionHistory(Long id, Pageable pageable) {
        if (!SecurityUtils.isAdmin()) {
            Auction auction = auctionRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));
            checkAuctionOwnership(auction);
        }

        Page<Bid> bidPage = bidRepository.findByAuctionIdOrderByCreatedAtDesc(id, pageable);

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

    private void populateImages(List<AuctionResponse> responses) {
        if (responses.isEmpty()) return;

        List<Long> auctionIds = responses.stream().map(AuctionResponse::getId).toList();
        List<FileResponse> allImages = fileRepository.findAllByOwnerTypeAndIds(OwnerType.AUCTION_IMAGE, auctionIds);

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
            List<FileResponse> images = fileRepository.findAllByOwnerTypeAndIds(OwnerType.AUCTION_IMAGE, List.of(response.getId()));
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
                                                        AuctionStatus status, Pageable pageable) {
        String statusStr = (status == null) ? AuctionStatus.ALL.name() : status.name();
        Page<Auction> auctionPage = auctionRepository
                .filterAuctions(keyword, startTime, endTime, status, statusStr, sellerId, pageable);
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
}

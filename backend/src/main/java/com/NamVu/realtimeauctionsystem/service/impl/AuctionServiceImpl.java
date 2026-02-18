package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.auction.*;
import com.NamVu.realtimeauctionsystem.dto.bid.BidUpdateMessage;
import com.NamVu.realtimeauctionsystem.dto.bid.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.dto.bid.PlaceBidRequestV1;
import com.NamVu.realtimeauctionsystem.dto.bid.PlaceBidResponse;
import com.NamVu.realtimeauctionsystem.dto.common.PageResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.mapper.AuctionMapper;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.AuctionService;
import com.NamVu.realtimeauctionsystem.service.RedisAuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

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

    @Override
    public PageResponse<AuctionResponse> getAuctionsByStatus(AuctionStatus status, Pageable pageable) {
        Instant oneHourFromNow = Instant.now().plus(1, ChronoUnit.HOURS);

        Page<Auction> auctionPage = auctionRepository.findByCustomStatus(status, oneHourFromNow, pageable);

        List<AuctionResponse> responses = auctionPage.getContent().stream()
                .map(auctionMapper::mapToResponse)
                .toList();

        return PageResponse.<AuctionResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(auctionPage.getTotalPages())
                .totalElements(auctionPage.getTotalElements())
                .data(responses)
                .build();
    }

    @Override
    public AuctionResponse getAuctionDetail(Long id) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        return auctionMapper.mapToResponse(auction);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    @Transactional
    public AuctionResponse saveDraft(CreateAuctionRequest request) {
        Auction auction = auctionMapper.mapToEntity(request);
        auction.setStatus(AuctionStatus.DRAFT);

        Long sellerId = getCurrentUserId();
        auction.setSeller(userRepository.getReferenceById(sellerId));

        auction = auctionRepository.save(auction);
        return auctionMapper.mapToResponse(auction);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
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

            auctionMapper.updateEntity(request, auction);
        } else {
            auction = auctionMapper.mapToEntity(request);
        }

        auction.setStatus(AuctionStatus.SCHEDULED);
        auction.setCurrentPrice(auction.getStartPrice());

        if (auction.getSeller() == null) {
            Long sellerId = getCurrentUserId();
            auction.setSeller(userRepository.getReferenceById(sellerId));
        }

        auction = auctionRepository.save(auction);
        return auctionMapper.mapToResponse(auction);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    @Transactional
    public AuctionResponse updateDraftAuction(Long id, UpdateDraftAuctionRequest request) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        if (auction.getStatus() != AuctionStatus.DRAFT) {
            throw new AppException(ErrorCode.AUCTION_STATUS_INVALID);
        }

        auctionMapper.updateEntity(request, auction);
        auction = auctionRepository.save(auction);

        return auctionMapper.mapToResponse(auction);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
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

        auctionMapper.updateEntity(request, auction);
        auction = auctionRepository.save(auction);

        return auctionMapper.mapToResponse(auction);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
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

        auction.setStatus(AuctionStatus.CANCELLED);
        auction = auctionRepository.save(auction);

        return CancelAuctionResponse.builder()
                .auctionId(auction.getId())
                .by(((Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getSubject())
                .timestamp(Instant.now())
                .reason(request.getReason())
                .build();
    }

    @Override
    public PlaceBidResponse placeBids(PlaceBidRequestV1 request) {
//        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
//        String name = jwt.getClaim("name");

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
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<AuctionResponse> filterAuction(String keyword, Instant startTime, Instant endTime,
                                                       AuctionStatus status, Pageable pageable) {
        String statusStr = (status == null) ? AuctionStatus.ALL.name() : status.name();
        Page<Auction> auctionPage = auctionRepository.filterAuctions(keyword, startTime, endTime, status, statusStr, pageable);

        List<AuctionResponse> responses = auctionPage.getContent().stream()
                .map(auctionMapper::mapToResponse)
                .toList();

        return PageResponse.<AuctionResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(auctionPage.getTotalPages())
                .totalElements(auctionPage.getTotalElements())
                .data(responses)
                .build();
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<AuctionHistoryResponse> getAuctionHistory(Long id, Pageable pageable) {
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

    private Long getCurrentUserId() {
        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return jwt.getClaim("uid");
    }
}

package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.BidUpdateMessage;
import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.dto.request.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.request.PlaceBidRequest;
import com.NamVu.realtimeauctionsystem.dto.response.AuctionResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PlaceBidResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.mapper.AuctionMapper;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.AuctionService;
import com.NamVu.realtimeauctionsystem.service.RedisAuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

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
    public AuctionResponse createAuction(CreateAuctionRequest request) {
        Auction auction = auctionMapper.mapToEntity(request);

        auction.setStatus(AuctionStatus.SCHEDULED);

        User seller = userRepository.findById(request.getSellerId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        auction.setSeller(seller);

        auction = auctionRepository.save(auction);
        return auctionMapper.mapToResponse(auction);
    }

    @Override
    public PlaceBidResponse placeBids(PlaceBidRequest request) {
        BidUpdateResult result = redisAuctionService
                .updateBidWithLock(request.getAuctionId(), request.getBidderId(), request.getAmount());

        // Push realtime update qua WebSocket
        if (result.isSuccess()) {
            BidUpdateMessage message = BidUpdateMessage.builder()
                    .auctionId(request.getAuctionId())
                    .currentPrice(result.getNewPrice())
                    .highestBidderId(result.getHighestBidderId())
                    .highestBidderName(result.getHighestBidderName())
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
                .highestBidderName(result.getHighestBidderName())
                .timestamp(result.getTimestamp())
                .extended(result.isExtended())
                .build();
    }
}

package com.namvu.realtimeauctionsystem.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.namvu.realtimeauctionsystem.dto.bid.BidPlacedEvent;
import com.namvu.realtimeauctionsystem.dto.bid.BidUpdateResult;
import com.namvu.realtimeauctionsystem.dto.bid.MyBidHistoryResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.entity.Bid;
import com.namvu.realtimeauctionsystem.enums.BidStatus;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.repository.BidRepository;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.service.BidService;
import com.namvu.realtimeauctionsystem.service.OutboxService;
import com.namvu.realtimeauctionsystem.service.RedisLuaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidServiceImpl implements BidService {

    private static final int MAX_EXTENSION = 3;

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final RedisLuaService redisLuaService;
    private final OutboxService outboxService;

    /**
     * Place bid V2: Lua Script + Outbox Pattern
     */
    @Override
    @Transactional
    public BidUpdateResult placeBidV2(Long auctionId, Long bidderId, BigDecimal newPrice) throws JsonProcessingException {
        Instant now = Instant.now();

        // Execute Lua Script (atomic)
        List<?> result;

        try {
            result = redisLuaService.executePlaceBid(
                    auctionId,
                    newPrice,
                    bidderId,
                    now.getEpochSecond(),
                    MAX_EXTENSION);
        } catch (Exception e) {
            throw new AppException(ErrorCode.REDIS_DOWN);
        }

        Long status = (Long) result.get(0);
        String message = (String) result.get(1);

        // Lua reject
        if (status == 0L) {
            return BidUpdateResult.failure(message, now);
        }

        // Parse result từ Lua
        String extendedFlag = (String) result.get(2);  // "extended" | "normal"
        boolean extended = "extended".equals(extendedFlag);
        long finalEndTimeEpoch = Long.parseLong((String) result.get(3));
        Instant finalEndTime = Instant.ofEpochSecond(finalEndTimeEpoch);
        Integer nextExtensionCount = ((Long) result.get(4)).intValue();

        // Ghi MySQL + Outbox (trong 1 transaction)
        Bid bid = Bid.builder()
                .auction(auctionRepository.getReferenceById(auctionId))
                .bidder(userRepository.getReferenceById(bidderId))
                .amount(newPrice)
                .status(BidStatus.ACCEPTED)
                .build();

        bidRepository.save(bid);
        outboxService.save(auctionId, bid, extended, finalEndTime);

        // Update auction
        int updatedRows = auctionRepository.updateAuctionPriceAndEndTime(auctionId, newPrice, bidderId, finalEndTime, nextExtensionCount);
        if (updatedRows == 0) {
            throw new AppException(ErrorCode.AUCTION_NOT_FOUND);
        }

        // Return success
        return BidUpdateResult.success(newPrice, bidderId, now, extended, finalEndTime);
    }

    /**
     * Tạo Bid record với status REJECTED khi DB sync fail
     */
    @Override
    public void createRejectedBidRecord(BidPlacedEvent event) {
        try {
            if (event.getAuctionId() == null || event.getBidderId() == null) {
                log.warn("Cannot create rejected bid: auction or bidder not found");
                return;
            }

            Bid bid = Bid.builder()
                    .auction(auctionRepository.getReferenceById(event.getAuctionId()))
                    .bidder(userRepository.getReferenceById(event.getBidderId()))
                    .amount(event.getAmount())
                    .status(BidStatus.REJECTED)
                    .build();

            bidRepository.save(bid);

            log.info("Created REJECTED bid record for auction={}, bidder={}", event.getAuctionId(), event.getBidderId());

        } catch (Exception e) {
            log.error("Failed to create rejected bid record", e);
        }
    }

    @Override
    public PageResponse<MyBidHistoryResponse> getMyBidHistory(Pageable pageable) {
        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        Long userId = jwt.getClaim("uid");

        return getBidHistory(userId, pageable);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<MyBidHistoryResponse> getBidHistoryForAdmin(Long userId, Pageable pageable) {
        return getBidHistory(userId, pageable);
    }

    private PageResponse<MyBidHistoryResponse> getBidHistory(Long userId, Pageable pageable) {
        Page<Bid> bidPage =  bidRepository.findByBidderIdOrderByCreatedAtDesc(userId, pageable);

        List<MyBidHistoryResponse> data = bidPage.stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<MyBidHistoryResponse>builder()
                .data(data)
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(bidPage.getTotalPages())
                .totalElements(bidPage.getTotalElements())
                .build();
    }

    private MyBidHistoryResponse mapToResponse(Bid bid) {
        Auction auction = bid.getAuction();

        return MyBidHistoryResponse.builder()
                .auctionId(auction.getId())
                .auctionTitle(auction.getTitle())
                .auctionStatus(auction.getStatus())
                .currentPrice(auction.getCurrentPrice())
                .amount(bid.getAmount())
                .status(bid.getStatus())
                .createdAt(bid.getCreatedAt())
                .build();
    }
}

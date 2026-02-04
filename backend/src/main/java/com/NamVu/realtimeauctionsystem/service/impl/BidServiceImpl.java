package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.BidPlacedEvent;
import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.dto.response.MyBidHistoryResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.BidStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.BidService;
import com.NamVu.realtimeauctionsystem.service.OutboxService;
import com.NamVu.realtimeauctionsystem.service.RedisLuaService;
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
     * Place bid V2
     */
    @Override
    @Transactional
    public BidUpdateResult placeBid(Long auctionId, Long bidderId, BigDecimal newPrice) {
        Instant now = Instant.now();

        // 1. Execute Lua Script (atomic)
        List<?> result = redisLuaService.executePlaceBid(
                auctionId,
                newPrice,
                bidderId,
                now.getEpochSecond(),
                MAX_EXTENSION);

        Long status = (Long) result.get(0);
        String message = (String) result.get(1);

        // 2. Lua reject
        if (status == 0L) {
            return BidUpdateResult.failure(message, now);
        }

        // 3. Parse result từ Lua
        String extendedFlag = (String) result.get(2);  // "extended" | "normal"
        boolean extended = "extended".equals(extendedFlag);

        // 4. Ghi MySQL + Outbox (trong 1 transaction)
        Bid bid = Bid.builder()
                .auction(auctionRepository.getReferenceById(auctionId))
                .bidder(userRepository.getReferenceById(bidderId))
                .amount(newPrice)
                .createdAt(now)
                .build();

        bidRepository.save(bid);
        outboxService.save(auctionId, bid, extended);

        // Update auction
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        auction.setCurrentPrice(newPrice);
        auction.setHighestBidder(userRepository.getReferenceById(bidderId));
        auctionRepository.save(auction);

        // 5. Return success
        return BidUpdateResult.success(newPrice, bidderId, now, extended);
    }

    /**
     * Tạo Bid record với status REJECTED khi DB sync fail
     */
    @Override
    public void createRejectedBidRecord(BidPlacedEvent event) {
        try {
            Auction auction = auctionRepository.findById(event.getAuctionId())
                    .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));
            User bidder = userRepository.findById(event.getBidderId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

            if (auction == null || bidder == null) {
                log.warn("Cannot create rejected bid: auction or bidder not found");
                return;
            }

            Bid bid = Bid.builder()
                    .auction(auction)
                    .bidder(bidder)
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

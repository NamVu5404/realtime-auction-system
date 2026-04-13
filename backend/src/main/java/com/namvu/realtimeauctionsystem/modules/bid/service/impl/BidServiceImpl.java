package com.namvu.realtimeauctionsystem.modules.bid.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.namvu.realtimeauctionsystem.common.constant.BidStatus;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionWinProjection;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.*;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.bid.repository.BidRepository;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidService;
import com.namvu.realtimeauctionsystem.modules.bid.service.OutboxService;
import com.namvu.realtimeauctionsystem.modules.bid.service.RedisLuaService;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidServiceImpl implements BidService {

    private static final int MAX_EXTENSION = 3;

    private final UserService userService;
    private final BidRepository bidRepository;
    private final RedisLuaService redisLuaService;
    private final OutboxService outboxService;
    private final AuctionService auctionService;

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

        String previousBidderIdStr = (String) result.get(5);
        Long previousBidderId = (previousBidderIdStr != null && !previousBidderIdStr.equals("NONE") && !previousBidderIdStr.isEmpty())
                ? Long.parseLong(previousBidderIdStr) : null;

        String sellerIdStr = (String) result.get(6);
        Long sellerId = (sellerIdStr != null && !sellerIdStr.isEmpty()) ? Long.parseLong(sellerIdStr) : null;

        // Ghi MySQL + Outbox (trong 1 transaction)
        Bid bid = Bid.builder()
                .auction(auctionService.getAuctionReference(auctionId))
                .bidder(userService.getUserReference(bidderId))
                .amount(newPrice)
                .status(BidStatus.ACCEPTED)
                .build();

        bidRepository.save(bid);
        outboxService.save(auctionId, bid, extended, finalEndTime, previousBidderId, sellerId);

        // Update auction
        int updatedRows = auctionService.applyBid(auctionId, newPrice, bidderId, finalEndTime, nextExtensionCount);
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
                    .auction(auctionService.getAuctionReference(event.getAuctionId()))
                    .bidder(userService.getUserReference(event.getBidderId()))
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
    @Transactional(readOnly = true)
    public PageResponse<MyBidHistoryResponse> getMyBidHistory(Pageable pageable) {
        return getBidHistory(SecurityUtils.getCurrentUserId(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public MyBidStatsResponse getMyBidStats(String period) {
        Long userId = SecurityUtils.getCurrentUserId();
        return getBidStats(userId, period);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public MyBidStatsResponse getBidStatsAdmin(Long userId, String period) {
        return getBidStats(userId, period);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<MyBidHistoryResponse> getBidHistoryForAdmin(Long userId, Pageable pageable) {
        return getBidHistory(userId, pageable);
    }

    @Override
    public Bid saveBid(Bid bid) {
        return bidRepository.save(bid);
    }

    @Override
    @Transactional(readOnly = true)
    public int countRecentBids(Long bidderId, Long auctionId, Instant since) {
        return bidRepository.countRecentBids(bidderId, auctionId, since);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bid> getRecentBids(Long bidderId, Long auctionId) {
        return bidRepository.findTop10ByBidderIdAndAuctionIdOrderByCreatedAtDesc(bidderId, auctionId);
    }

    @Override
    public Set<Long> getParticipantIds(Long auctionId) {
        return bidRepository.findAllBidderIdsByAuctionId(auctionId);
    }

    private PageResponse<MyBidHistoryResponse> getBidHistory(Long userId, Pageable pageable) {
        Page<Bid> bidPage = bidRepository.findByBidderIdOrderByCreatedAtDesc(userId, pageable);

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

    private MyBidStatsResponse getBidStats(Long userId, String period) {
        String timeFormat = "WEEK".equalsIgnoreCase(period) ? "%x-W%v" : "%Y-%m";
        Instant startDate = "WEEK".equalsIgnoreCase(period)
                ? Instant.now().minus(30 * 3L, ChronoUnit.DAYS) // 3 months
                : Instant.now().minus(365, ChronoUnit.DAYS);   // 1 year

        Long totalBids = bidRepository.countTotalBids(userId);
        Long totalAuctionsParticipated = bidRepository.countTotalAuctionsParticipated(userId);
        List<BidChartProjection> chartData = bidRepository.getBidActivityChart(userId, startDate, timeFormat);

        AuctionWinProjection winStats = auctionService.getAuctionWinMetrics(userId);

        return MyBidStatsResponse.builder()
                .totalAuctionsParticipated(totalAuctionsParticipated)
                .totalWins(winStats.getTotalWins())
                .totalBids(totalBids)
                .highestWinningBid(winStats.getHighestWinningBid())
                .totalSpent(winStats.getTotalSpent())
                .activeLeading(winStats.getActiveLeading())
                .activityChart(chartData)
                .build();
    }
}

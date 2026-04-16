package com.namvu.realtimeauctionsystem.modules.auction.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.constant.BidStatus;
import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.fraud.dto.FraudCheckResult;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionDbSyncService;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidPlacedEvent;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidService;
import com.namvu.realtimeauctionsystem.modules.fraud.service.FraudDetectionService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserAuditService;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionDbSyncServiceImpl implements AuctionDbSyncService {

    private final AuctionService auctionService;
    private final UserService userService;
    private final BidService bidService;
    private final FraudDetectionService fraudDetectionService;
    private final RedisAuctionService redisAuctionService;
    private final UserAuditService auditService;

    private static final int MAX_AUTO_RETRY = 5;

    /**
     * Sync bid từ Kafka event vào Database
     * Có retry với optimistic lock
     */
    @Override
    @Transactional
    public void syncBidToDatabase(BidPlacedEvent event) {
        int attempt = 0;
        while (attempt < MAX_AUTO_RETRY) {
            try {
                doSync(event);
                return;
            } catch (OptimisticLockingFailureException e) {
                attempt++;
                handleRetry(attempt, e);
            }
        }
    }

    private void doSync(BidPlacedEvent event) {
        Auction auction = getValidAuction(event.getAuctionId());
        User bidder = getValidBidder(event.getBidderId());
        BigDecimal oldPrice = auction.getCurrentPrice();

        updateAuctionState(auction, bidder, event);
        auction = auctionService.saveAuction(auction);

        processBidAndFraud(event, auction, bidder, oldPrice);
    }

    private User getValidBidder(Long bidderId) {
        User bidder = userService.getActiveUserById(bidderId);

        if (bidder.getStatus() == UserStatus.BLOCKED) {
            log.warn("User {} is blocked, cannot sync bid", bidderId);
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        return bidder;
    }

    private Auction getValidAuction(Long auctionId) {
        Auction auction = auctionService.getAuctionDetailById(auctionId);
        if (auction.getStatus() != AuctionStatus.LIVE) {
            log.warn("Auction {} is not live, skip DB sync", auctionId);
            throw new AppException(ErrorCode.AUCTION_NOT_FOUND);
        }
        return auction;
    }

    private void updateAuctionState(Auction auction, User bidder, BidPlacedEvent event) {
        auction.setCurrentPrice(event.getAmount());
        auction.setHighestBidder(bidder);

        if (event.isExtended()) {
            Optional.ofNullable(redisAuctionService.getAuctionData(event.getAuctionId()))
                    .ifPresent(data -> auction.setEndTime(data.getEndTime()));
        }
    }

    private void processBidAndFraud(BidPlacedEvent event, Auction auction, User bidder, BigDecimal oldPrice) {
        Bid bid = Bid.builder()
                .auction(auction)
                .bidder(bidder)
                .amount(event.getAmount())
                .status(BidStatus.ACCEPTED)
                .build();

        FraudCheckResult fraud = fraudDetectionService.checkBid(bid, auction, oldPrice);

        if (fraud.isHighRisk() || fraud.isMediumRisk()) {
            handleFraudulentBid(bid, auction, fraud);
        }

        bid = bidService.saveBid(bid);
        auditService.fraudAudit(bid, auction, fraud.getPrimaryViolation(), fraud.getReason());
    }

    private void handleFraudulentBid(Bid bid, Auction auction, FraudCheckResult fraud) {
        bid.setStatus(BidStatus.FLAGGED);
        fraudDetectionService.logFraud(bid, auction, fraud.getPrimaryViolation(), fraud.getReason());
        log.warn("Bid FLAGGED for fraud: auction={}, reason={}", auction.getId(), fraud.getReason());
    }

    private void handleRetry(int attempt, OptimisticLockingFailureException e) {
        log.warn("Optimistic lock conflict (attempt {}/{}) - Reason: {}", attempt, MAX_AUTO_RETRY, e.getMessage());

        if (attempt >= MAX_AUTO_RETRY) {
            throw new AppException(ErrorCode.MAX_RETRIES_EXCEEDED);
        }
        try {
            Thread.sleep(100L * attempt);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.INTERRUPTED_DURING_RETRY);
        }
    }
}

package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.auction.FraudCheckResult;
import com.namvu.realtimeauctionsystem.dto.bid.BidPlacedEvent;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.entity.Bid;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.AuctionStatus;
import com.namvu.realtimeauctionsystem.enums.BidStatus;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.repository.BidRepository;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.service.AuctionDbSyncService;
import com.namvu.realtimeauctionsystem.service.FraudDetectionService;
import com.namvu.realtimeauctionsystem.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.service.UserAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionDbSyncServiceImpl implements AuctionDbSyncService {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
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

    /**
     * Batch sync nhiều auctions cùng lúc (cho scheduled job)
     */
    @Override
    @Transactional
    public void batchSyncFromRedis(List<Long> auctionIds) {
        throw new UnsupportedOperationException("Batch sync from Redis is not implemented yet.");
    }

    private void doSync(BidPlacedEvent event) {
        Auction auction = getValidAuction(event.getAuctionId());
        User bidder = getValidBidder(event.getBidderId());
        BigDecimal oldPrice = auction.getCurrentPrice();

        updateAuctionState(auction, bidder, event);
        auction = auctionRepository.save(auction);

        processBidAndFraud(event, auction, bidder, oldPrice);
    }

    private User getValidBidder(Long bidderId) {
        User bidder = userRepository.findById(bidderId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (bidder.getStatus() == UserStatus.BLOCKED) {
            log.warn("User {} is blocked, cannot sync bid", bidderId);
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        return bidder;
    }

    private Auction getValidAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));
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

        bidRepository.save(bid);
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

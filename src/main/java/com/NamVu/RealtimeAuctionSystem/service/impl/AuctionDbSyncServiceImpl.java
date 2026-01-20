package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.BidPlacedEvent;
import com.NamVu.realtimeauctionsystem.dto.FraudCheckResult;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import com.NamVu.realtimeauctionsystem.enums.BidStatus;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.AuctionDbSyncService;
import com.NamVu.realtimeauctionsystem.service.FraudDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionDbSyncServiceImpl implements AuctionDbSyncService {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final FraudDetectionService fraudDetectionService;

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
                Auction auction = auctionRepository.findById(event.getAuctionId())
                        .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

                if (auction.getStatus() != AuctionStatus.LIVE) {
                    log.warn("Auction {} is not live, skip DB sync", event.getAuctionId());
                    throw new AppException(ErrorCode.AUCTION_NOT_FOUND);
                }

                User bidder = userRepository.findById(event.getBidderId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

                if (bidder.getStatus() == UserStatus.BLOCKED) {
                    throw new AppException(ErrorCode.USER_BLOCKED);
                }

                // Update auction (optimistic lock sẽ check version)
                auction.setCurrentPrice(event.getAmount());
                auction.setHighestBidder(bidder);
                auction = auctionRepository.save(auction);

                // Create bid record
                Bid bid = Bid.builder()
                        .auction(auction)
                        .bidder(bidder)
                        .amount(event.getAmount())
                        .status(BidStatus.ACCEPTED)
                        .build();

                // FRAUD DETECTION - Chỉ gán cờ FLAGGED nếu vi phạm
                FraudCheckResult fraudCheck = fraudDetectionService.checkBid(bid, auction);

                if (fraudCheck.isHighRisk() || fraudCheck.isMediumRisk()) {
                    bid.setStatus(BidStatus.FLAGGED);

                    // Log fraud
                    fraudDetectionService.logFraud(
                            bid,
                            auction,
                            fraudCheck.getPrimaryViolation(),
                            fraudCheck.getReason()
                    );

                    log.warn("Bid FLAGGED for fraud: auction={}, bidder={}, reason={}",
                            event.getAuctionId(), event.getBidderId(), fraudCheck.getReason());
                }

                bidRepository.save(bid);

                log.info("DB synced: auction={}, price={}, bidder={}, version={}",
                        event.getAuctionId(), event.getAmount(), event.getBidderId(), auction.getVersion());

                return; // Success

            } catch (OptimisticLockingFailureException e) {
                attempt++;
                log.warn("Optimistic lock conflict (attempt {}/{})", attempt, MAX_AUTO_RETRY);

                if (attempt >= MAX_AUTO_RETRY) {
                    log.error("Failed to sync bid after {} retries", MAX_AUTO_RETRY);
                    throw new AppException(ErrorCode.MAX_RETRIES_EXCEEDED);
                }

                // Exponential backoff
                try {
                    Thread.sleep(100L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new AppException(ErrorCode.INTERRUPTED_DURING_RETRY);
                }
            }
        }
    }

    /**
     * Batch sync nhiều auctions cùng lúc (cho scheduled job)
     */
    @Override
    @Transactional
    public void batchSyncFromRedis(List<Long> auctionIds) {

    }
}

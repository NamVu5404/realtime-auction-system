package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.auction.FraudCheckResult;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.FraudLog;
import com.NamVu.realtimeauctionsystem.enums.FraudType;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import com.NamVu.realtimeauctionsystem.repository.FraudLogRepository;
import com.NamVu.realtimeauctionsystem.service.FraudDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionServiceImpl implements FraudDetectionService {

    private final BidRepository bidRepository;
    private final FraudLogRepository fraudLogRepository;

    @Override
    public FraudCheckResult checkBid(Bid bid, Auction auction, BigDecimal currentPrice) {
        FraudCheckResult result = new FraudCheckResult();

        // RULE 1: Self-bidding (người bán tự đặt giá)
        if (auction.getSeller().getId().equals(bid.getBidder().getId())) {
            result.addViolation(FraudType.SELF_BIDDING, 100);
        }

        // RULE 2: Rate limit (đặt giá quá nhiều trong thời gian ngắn)
        Instant since = Instant.now().minus(60, ChronoUnit.SECONDS);
        int recentBids = bidRepository.countRecentBids(
                bid.getBidder().getId(),
                auction.getId(),
                since
        );

        if (recentBids > 10) { // >10 bids trong 60s
            result.addViolation(FraudType.RATE_LIMIT, 80);
        }

        // RULE 3: Price spike (giá tăng đột biến, giá mới > 1.5x giá cũ)
        BigDecimal bidAmount = bid.getAmount();
        BigDecimal threshold = currentPrice.multiply(BigDecimal.valueOf(1.5));

        if (bidAmount.compareTo(threshold) > 0) {
            result.addViolation(FraudType.PRICE_SPIKE, 50);
        }

        // RULE 4: Last second sniping (đặt giá phút chót)
        if (auction.getEndTime() != null) {
            long secondsUntilEnd = Duration.between(Instant.now(), auction.getEndTime()).getSeconds();
            if (secondsUntilEnd < auction.getAntiSnipeSeconds()) {
                result.addViolation(FraudType.LAST_SECOND_SNIPING, 30);
            }
        }

        // RULE 5: Bot behavior (pattern đặt giá giống bot)
        if (detectBotBehavior(bid.getBidder().getId(), auction.getId())) {
            result.addViolation(FraudType.BOT_BEHAVIOR, 70);
        }

        return result;
    }

    @Override
    public boolean detectBotBehavior(Long bidderId, Long auctionId) {
        // Lấy 10 bids gần nhất
        List<Bid> recentBids = bidRepository.findTop10ByBidderIdAndAuctionIdOrderByCreatedAtDesc(
                bidderId, auctionId
        );

        if (recentBids.size() < 5) return false;

        // Kiểm tra pattern: các bid cách nhau đều đặn (ví dụ: mỗi 5s)
        List<Long> intervals = new ArrayList<>();
        for (int i = 0; i < recentBids.size() - 1; i++) {
            long interval = Duration.between(
                    recentBids.get(i + 1).getCreatedAt(),
                    recentBids.get(i).getCreatedAt()
            ).getSeconds();
            intervals.add(interval);
        }

        // Nếu tất cả intervals gần bằng nhau (±2s) -> có thể là bot
        if (intervals.size() >= 4) {
            long avg = intervals.stream().mapToLong(Long::longValue).sum() / intervals.size();
            boolean allSimilar = intervals.stream()
                    .allMatch(i -> Math.abs(i - avg) <= 2);

            if (allSimilar && avg <= 10) {
                log.warn("Potential bot behavior detected: bidder={}, avg_interval={}s",
                        bidderId, avg);
                return true;
            }
        }

        return false;
    }

    @Override
    public void logFraud(Bid bid, Auction auction, FraudType type, String reason) {
        FraudLog log = FraudLog.builder()
                .user(bid.getBidder())
                .auction(auction)
                .bid(bid)
                .type(type)
                .reason(reason)
                .build();

        fraudLogRepository.save(log);
    }
}

package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.auction.FraudCheckResult;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.entity.Bid;
import com.namvu.realtimeauctionsystem.enums.FraudType;

import java.math.BigDecimal;

public interface FraudDetectionService {
    FraudCheckResult checkBid(Bid bid, Auction auction, BigDecimal currentPrice);

    boolean detectBotBehavior(Long bidderId, Long auctionId);

    void logFraud(Bid bid, Auction auction, FraudType type, String reason);
}

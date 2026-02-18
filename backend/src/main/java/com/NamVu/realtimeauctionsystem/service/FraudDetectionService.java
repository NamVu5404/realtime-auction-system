package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.auction.FraudCheckResult;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.enums.FraudType;

import java.math.BigDecimal;

public interface FraudDetectionService {
    FraudCheckResult checkBid(Bid bid, Auction auction, BigDecimal currentPrice);

    boolean detectBotBehavior(Long bidderId, Long auctionId);

    void logFraud(Bid bid, Auction auction, FraudType type, String reason);
}

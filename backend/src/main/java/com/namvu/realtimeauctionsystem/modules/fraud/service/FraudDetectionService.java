package com.namvu.realtimeauctionsystem.modules.fraud.service;

import com.namvu.realtimeauctionsystem.modules.auction.dto.FraudCheckResult;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.common.enums.FraudType;

import java.math.BigDecimal;

public interface FraudDetectionService {
    FraudCheckResult checkBid(Bid bid, Auction auction, BigDecimal currentPrice);

    boolean detectBotBehavior(Long bidderId, Long auctionId);

    void logFraud(Bid bid, Auction auction, FraudType type, String reason);
}

package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.AuctionRedisData;
import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.entity.Auction;

import java.math.BigDecimal;
import java.time.Instant;

public interface RedisAuctionService {
    void initAuction(Long auctionId, BigDecimal startPrice, BigDecimal minStep, Long sellerId, Instant endTime, Integer antiSnipeSeconds, Integer extensionSeconds);

    BidUpdateResult updateBidWithLock(Long auctionId, Long bidderId, BigDecimal newPrice);

    BigDecimal getCurrentPrice(Long auctionId);

    Long getHighestBidderId(Long auctionId);

    AuctionRedisData getAuctionData(Long auctionId);

    void updateEndTime(Long auctionId, Instant newEndTime);

    void updateStatus(Long auctionId, String status);

    void deleteAuction(Long auctionId);

    boolean exists(Long auctionId);

    boolean checkAndExtendAuction(Long auctionId, Instant bidTime);

    void syncFromDatabase(Auction auction);
}

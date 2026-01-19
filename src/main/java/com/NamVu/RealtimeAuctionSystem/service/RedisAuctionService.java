package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.response.AuctionRedisData;
import com.NamVu.realtimeauctionsystem.entity.Auction;

import java.math.BigDecimal;
import java.time.Instant;

public interface RedisAuctionService {
    void initAuction(Long auctionId, BigDecimal startPrice, Long sellerId, Instant endTime);

    boolean updateBidWithLock(Long auctionId, Long bidderId, BigDecimal newPrice);

    BigDecimal getCurrentPrice(Long auctionId);

    Long getHighestBidderId(Long auctionId);

    AuctionRedisData getAuctionData(Long auctionId);

    void updateEndTime(Long auctionId, Instant newEndTime);

    void updateStatus(Long auctionId, String status);

    void deleteAuction(Long auctionId);

    boolean exists(Long auctionId);

    void syncFromDatabase(Auction auction);
}

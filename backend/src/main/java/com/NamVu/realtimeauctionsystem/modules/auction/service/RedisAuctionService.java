package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionInitRequest;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionRedisData;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;

import java.math.BigDecimal;
import java.time.Instant;

public interface RedisAuctionService {
    void initAuction(AuctionInitRequest request);

    BidUpdateResult updateBidWithLock(Long auctionId, Long bidderId, BigDecimal newPrice);

    String getAuctionTitle(Long auctionId);

    BigDecimal getCurrentPrice(Long auctionId);

    Long getHighestBidderId(Long auctionId);

    AuctionRedisData getAuctionData(Long auctionId);

    void updateEndTime(Long auctionId, Instant newEndTime);

    void updateStatus(Long auctionId, String status);

    void deleteAuction(Long auctionId);

    boolean exists(Long auctionId);

    void syncFromDatabase(Auction auction);
}

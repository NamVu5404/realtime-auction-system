package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.auction.AuctionInitRequest;
import com.namvu.realtimeauctionsystem.dto.auction.AuctionRedisData;
import com.namvu.realtimeauctionsystem.dto.bid.BidUpdateResult;
import com.namvu.realtimeauctionsystem.entity.Auction;

import java.math.BigDecimal;
import java.time.Instant;

public interface RedisAuctionService {
    void initAuction(AuctionInitRequest request);

    BidUpdateResult updateBidWithLock(Long auctionId, Long bidderId, BigDecimal newPrice);

    BigDecimal getCurrentPrice(Long auctionId);

    Long getHighestBidderId(Long auctionId);

    AuctionRedisData getAuctionData(Long auctionId);

    void updateEndTime(Long auctionId, Instant newEndTime);

    void updateStatus(Long auctionId, String status);

    void deleteAuction(Long auctionId);

    boolean exists(Long auctionId);

    void syncFromDatabase(Auction auction);
}

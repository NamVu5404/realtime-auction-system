package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionInitRequest;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionRedisData;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionStateSnapshot;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;

import java.math.BigDecimal;

public interface RedisAuctionService {
    void initAuction(AuctionInitRequest request);

    BidUpdateResult updateBidWithLock(Long auctionId, Long bidderId, BigDecimal newPrice);

    String getAuctionTitle(Long auctionId);

    BigDecimal getCurrentPrice(Long auctionId);

    AuctionRedisData getAuctionData(Long auctionId);

    void updateStatus(Long auctionId, String status);

    void deleteAuction(Long auctionId);

    void syncFromDatabase(Auction auction);

    AuctionStateSnapshot getAuctionStateFromRedis(Long auctionId);
}

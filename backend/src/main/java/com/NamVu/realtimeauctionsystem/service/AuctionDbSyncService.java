package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.bid.BidPlacedEvent;

import java.util.List;

public interface AuctionDbSyncService {
    void syncBidToDatabase(BidPlacedEvent event);

    void batchSyncFromRedis(List<Long> auctionIds);
}

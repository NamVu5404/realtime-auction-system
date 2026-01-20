package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.BidPlacedEvent;

import java.util.List;

public interface AuctionDbSyncService {
    void syncBidToDatabase(BidPlacedEvent event);

    void batchSyncFromRedis(List<Long> auctionIds);
}

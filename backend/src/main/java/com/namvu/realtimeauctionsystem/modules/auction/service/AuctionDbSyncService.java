package com.namvu.realtimeauctionsystem.modules.auction.service;

import com.namvu.realtimeauctionsystem.modules.bid.dto.BidPlacedEvent;

public interface AuctionDbSyncService {
    void syncBidToDatabase(BidPlacedEvent event);
}

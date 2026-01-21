package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.BidPlacedEvent;

public interface BiddingService {
    void createRejectedBidRecord(BidPlacedEvent event);
}

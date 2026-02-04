package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.entity.Bid;

public interface OutboxService {
    void save(Long auctionId, Bid bid, boolean extended);
}

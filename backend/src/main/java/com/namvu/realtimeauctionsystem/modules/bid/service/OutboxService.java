package com.namvu.realtimeauctionsystem.modules.bid.service;

import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.time.Instant;

public interface OutboxService {
    void save(Long auctionId, Bid bid, boolean extended, Instant finalEndTime, Long previousBidderId, Long sellerId) throws JsonProcessingException;
}

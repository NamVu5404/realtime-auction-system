package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.fasterxml.jackson.core.JsonProcessingException;

public interface OutboxService {
    void save(Long auctionId, Bid bid, boolean extended) throws JsonProcessingException;
}

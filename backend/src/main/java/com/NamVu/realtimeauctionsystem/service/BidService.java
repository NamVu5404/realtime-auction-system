package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.bid.BidPlacedEvent;
import com.NamVu.realtimeauctionsystem.dto.bid.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.dto.bid.MyBidHistoryResponse;
import com.NamVu.realtimeauctionsystem.dto.common.PageResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface BidService {
    BidUpdateResult placeBid(Long auctionId, Long bidderId, BigDecimal newPrice) throws JsonProcessingException;

    void createRejectedBidRecord(BidPlacedEvent event);

    PageResponse<MyBidHistoryResponse> getMyBidHistory(Pageable pageable);

    PageResponse<MyBidHistoryResponse> getBidHistoryForAdmin(Long userId, Pageable pageable);
}

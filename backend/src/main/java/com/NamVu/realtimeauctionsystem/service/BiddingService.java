package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.BidPlacedEvent;
import com.NamVu.realtimeauctionsystem.dto.response.MyBidHistoryResponse;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface BiddingService {
    void createRejectedBidRecord(BidPlacedEvent event);

    PageResponse<MyBidHistoryResponse> getMyBidHistory(Pageable pageable);
}

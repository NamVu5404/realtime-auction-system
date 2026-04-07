package com.namvu.realtimeauctionsystem.modules.bid.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidPlacedEvent;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;
import com.namvu.realtimeauctionsystem.modules.bid.dto.MyBidHistoryResponse;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public interface BidService {
    BidUpdateResult placeBidV2(Long auctionId, Long bidderId, BigDecimal newPrice) throws JsonProcessingException;

    void createRejectedBidRecord(BidPlacedEvent event);

    PageResponse<MyBidHistoryResponse> getMyBidHistory(Pageable pageable);

    PageResponse<MyBidHistoryResponse> getBidHistoryForAdmin(Long userId, Pageable pageable);

    Bid saveBid(Bid bid);

    int countRecentBids(Long bidderId, Long auctionId, Instant since);

    List<Bid> getRecentBids(Long bidderId, Long auctionId);

    Set<Long> getParticipantIds(Long auctionId);
}

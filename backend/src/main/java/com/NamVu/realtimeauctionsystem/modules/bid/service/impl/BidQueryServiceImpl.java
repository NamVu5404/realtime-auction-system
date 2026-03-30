package com.namvu.realtimeauctionsystem.modules.bid.service.impl;

import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.bid.repository.BidRepository;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BidQueryServiceImpl implements BidQueryService {

    private final BidRepository bidRepository;

    @Override
    public Page<Bid> getPagedBidsByAuction(Long id, Pageable pageable) {
        return bidRepository.findByAuctionIdOrderByCreatedAtDesc(id, pageable);
    }
}

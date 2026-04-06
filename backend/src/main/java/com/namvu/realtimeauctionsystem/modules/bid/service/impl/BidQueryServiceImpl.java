package com.namvu.realtimeauctionsystem.modules.bid.service.impl;

import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.bid.repository.BidRepository;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BidQueryServiceImpl implements BidQueryService {

    private final BidRepository bidRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<Bid> getPagedBidsByAuction(Long id, Pageable pageable) {
        return bidRepository.findByAuctionIdOrderByCreatedAtDesc(id, pageable);
    }
}

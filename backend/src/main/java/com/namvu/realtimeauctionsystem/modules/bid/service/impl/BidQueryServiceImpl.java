package com.namvu.realtimeauctionsystem.modules.bid.service.impl;

import com.namvu.realtimeauctionsystem.modules.bid.dto.BidProjection;
import com.namvu.realtimeauctionsystem.modules.bid.dto.MostActiveAuctionData;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.bid.repository.BidRepository;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BidQueryServiceImpl implements BidQueryService {

    private final BidRepository bidRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<Bid> getPagedBidsByAuction(Long auctionId, Pageable pageable) {
        return bidRepository.findByAuctionIdOrderByCreatedAtDesc(auctionId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Long countTotalBidsReceivedBySeller(Long sellerId) {
        return bidRepository.countTotalBidsReceivedBySeller(sellerId);
    }

    @Override
    @Transactional(readOnly = true)
    public Long countUniqueBiddersBySeller(Long sellerId) {
        return bidRepository.countUniqueBiddersBySeller(sellerId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAllBids() {
        return bidRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BidProjection> getAdminBidChartData(Instant startDate, String timeFormat) {
        return bidRepository.getAdminBidChartData(startDate, timeFormat);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MostActiveAuctionData> getMostActiveAuctions(int limit) {
        return bidRepository.getMostActiveAuctions(PageRequest.of(0, limit)).stream()
                .map(projection -> MostActiveAuctionData.builder()
                        .auctionId(projection.getAuctionId())
                        .title(projection.getTitle())
                        .bidCount(projection.getBidCount())
                        .currentPrice(projection.getCurrentPrice())
                        .status(projection.getStatus())
                        .build())
                .toList();
    }
}

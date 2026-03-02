package com.namvu.realtimeauctionsystem.repository;

import com.namvu.realtimeauctionsystem.entity.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    List<Bid> findByAuctionIdOrderByCreatedAtDesc(Long auctionId);

    @Query("SELECT COUNT(b) FROM Bid b WHERE b.bidder.id = :bidderId " +
            "AND b.auction.id = :auctionId AND b.createdAt > :since")
    int countRecentBids(@Param("bidderId") Long bidderId,
                        @Param("auctionId") Long auctionId,
                        @Param("since") Instant since);

    // Lấy bids gần nhất để phát hiện bot
    @Query("SELECT b FROM Bid b WHERE b.bidder.id = :bidderId " +
            "AND b.auction.id = :auctionId ORDER BY b.createdAt DESC")
    List<Bid> findTop10ByBidderIdAndAuctionIdOrderByCreatedAtDesc(
            @Param("bidderId") Long bidderId,
            @Param("auctionId") Long auctionId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"auction"})
    Page<Bid> findByBidderIdOrderByCreatedAtDesc(Long bidderId, Pageable pageable);

    @EntityGraph(attributePaths = {"bidder"})
    Page<Bid> findByAuctionIdOrderByCreatedAtDesc(Long auctionId, Pageable pageable);

    // Helper method
    default List<Bid> findTop10ByBidderIdAndAuctionIdOrderByCreatedAtDesc(Long bidderId, Long auctionId) {
        return findTop10ByBidderIdAndAuctionIdOrderByCreatedAtDesc(
                bidderId, auctionId, PageRequest.of(0, 10)
        );
    }
}

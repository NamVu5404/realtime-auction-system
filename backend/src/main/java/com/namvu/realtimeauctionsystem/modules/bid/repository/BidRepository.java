package com.namvu.realtimeauctionsystem.modules.bid.repository;

import com.namvu.realtimeauctionsystem.modules.bid.dto.BidProjection;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidChartProjection;
import com.namvu.realtimeauctionsystem.modules.bid.dto.MostActiveAuctionProjection;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
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
import java.util.Set;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

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

    @Query("SELECT DISTINCT b.bidder.id FROM Bid b " +
            "WHERE b.auction.id = :auctionId ")
    Set<Long> findAllBidderIdsByAuctionId(@Param("auctionId") Long auctionId);

    @Query("SELECT COUNT(b.id) FROM Bid b WHERE b.bidder.id = :bidderId")
    Long countTotalBids(@Param("bidderId") Long bidderId);

    @Query("SELECT COUNT(DISTINCT b.auction.id) FROM Bid b WHERE b.bidder.id = :bidderId")
    Long countTotalAuctionsParticipated(@Param("bidderId") Long bidderId);

    @Query("""
            SELECT
                FUNCTION('DATE_FORMAT', b.createdAt, :timeFormat) AS periodLabel,
                COUNT(b.id) AS bidCount,
                COUNT(DISTINCT b.auction.id) AS auctionsParticipated
            FROM Bid b
            WHERE b.bidder.id = :bidderId AND b.createdAt >= :startDate
            GROUP BY FUNCTION('DATE_FORMAT', b.createdAt, :timeFormat)
            ORDER BY FUNCTION('DATE_FORMAT', b.createdAt, :timeFormat) ASC
            """)
    List<BidChartProjection> getBidActivityChart(
            @Param("bidderId") Long bidderId,
            @Param("startDate") Instant startDate,
            @Param("timeFormat") String timeFormat
    );

    @Query("SELECT COUNT(b.id) FROM Bid b WHERE b.auction.seller.id = :sellerId")
    Long countTotalBidsReceivedBySeller(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(DISTINCT b.bidder.id) FROM Bid b WHERE b.auction.seller.id = :sellerId")
    Long countUniqueBiddersBySeller(@Param("sellerId") Long sellerId);

    // Helper method
    default List<Bid> findTop10ByBidderIdAndAuctionIdOrderByCreatedAtDesc(Long bidderId, Long auctionId) {
        return findTop10ByBidderIdAndAuctionIdOrderByCreatedAtDesc(
                bidderId, auctionId, PageRequest.of(0, 10)
        );
    }

    @Query("""
            SELECT
                FUNCTION('DATE_FORMAT', b.createdAt, :timeFormat) AS periodLabel,
                COUNT(b.id) AS bidCount
            FROM Bid b
            WHERE b.createdAt >= :startDate
            GROUP BY FUNCTION('DATE_FORMAT', b.createdAt, :timeFormat)
            ORDER BY FUNCTION('DATE_FORMAT', b.createdAt, :timeFormat) ASC
            """)
    List<BidProjection> getAdminBidChartData(
            @Param("startDate") Instant startDate,
            @Param("timeFormat") String timeFormat
    );

    @Query("""
            SELECT
                b.auction.id AS auctionId,
                b.auction.title AS title,
                COUNT(b.id) AS bidCount,
                b.auction.currentPrice AS currentPrice,
                b.auction.status AS status
            FROM Bid b
            GROUP BY b.auction.id, b.auction.title, b.auction.currentPrice, b.auction.status
            ORDER BY bidCount DESC
            """)
    List<MostActiveAuctionProjection> getMostActiveAuctions(Pageable pageable);
}

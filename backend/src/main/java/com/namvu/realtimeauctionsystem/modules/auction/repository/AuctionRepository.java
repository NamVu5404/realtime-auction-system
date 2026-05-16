package com.namvu.realtimeauctionsystem.modules.auction.repository;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.modules.auction.dto.*;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    @Query("SELECT a FROM Auction a WHERE (" +
            "(:q IS NULL OR " +
            "  LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "  LOWER(a.description) LIKE LOWER(CONCAT('%', :q, '%'))" +
            ") AND (" +
            "   (:status = 'ALL' AND a.status IN ('LIVE', 'SCHEDULED', 'ENDED', 'ENDED_NO_SALE')) OR " +
            "   (:status = 'LIVE' AND (a.status = 'LIVE' OR (a.status = 'SCHEDULED' AND a.startTime <= :oneHourFromNow))) OR " +
            "   (:status = 'SCHEDULED' AND a.status = 'SCHEDULED' AND a.startTime > :oneHourFromNow) OR " +
            "   (:status = 'ENDED' AND (a.status = :status OR a.status = 'ENDED_NO_SALE')) " +
            ")) " +
            "AND a.privateMode = false " +
            "ORDER BY " +
            "CASE WHEN :status = 'LIVE' AND a.status = 'LIVE' THEN 0 " +
            "     WHEN :status = 'LIVE' AND a.status = 'SCHEDULED' THEN 1 " +
            "     ELSE 0 END ASC, " +
            "CASE WHEN :status = 'LIVE' THEN a.endTime END ASC, " +
            "CASE WHEN :status = 'ENDED' THEN a.endTime END DESC, " +
            "CASE WHEN :status = 'SCHEDULED' THEN a.startTime END ASC")
    Page<Auction> findByCustomStatus(
            @Param("q") String q,
            @Param("status") AuctionStatus status,
            @Param("oneHourFromNow") Instant oneHourFromNow,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"seller"})
    List<Auction> findByStatusAndStartTimeLessThanEqual(AuctionStatus status, Instant startTime);

    @EntityGraph(attributePaths = {"seller", "highestBidder"})
    List<Auction> findByStatusAndEndTimeLessThanEqual(AuctionStatus status, Instant endTime);

    @Query("SELECT a FROM Auction a " +
            "LEFT JOIN a.seller s " +
            "WHERE " +
            "(:keyword IS NULL OR " +
            "  LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "  LOWER(a.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "  LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "  LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
            ") AND " +
            "(:startTime IS NULL OR a.startTime >= :startTime) AND " +
            "(:endTime IS NULL OR a.endTime <= :endTime) AND " +
            "(:statusStr = 'ALL' OR a.status = :status) AND " +
            "(:privateMode IS NULL OR a.privateMode = :privateMode) AND " +
            "(:sellerId IS NULL OR s.id = :sellerId) " +
            "ORDER BY a.createdAt DESC")
    Page<Auction> filterAuctions(
            @Param("keyword") String keyword,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("status") AuctionStatus status,
            @Param("statusStr") String statusStr,
            @Param("sellerId") Long sellerId,
            @Param("privateMode") Boolean privateMode,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    Optional<Auction> findByIdWithLock(Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Auction a " +
            "SET a.currentPrice = :newPrice, " +
            "a.highestBidder.id = :bidderId, " +
            "a.endTime = :endTime, " +
            "a.extensionCount = :extensionCount, " +
            "a.version = a.version + 1 " +
            "WHERE a.id = :auctionId")
    int updateAuctionPriceAndEndTime(
            @Param("auctionId") Long auctionId,
            @Param("newPrice") BigDecimal newPrice,
            @Param("bidderId") Long bidderId,
            @Param("endTime") Instant endTime,
            @Param("extensionCount") Integer extensionCount
    );

    @Query("""
                SELECT a FROM Auction a
                WHERE a.id IN (
                    SELECT b.auction.id FROM Bid b WHERE b.bidder.id = :userId
                )
                ORDER BY (
                    SELECT MAX(b2.createdAt) FROM Bid b2
                    WHERE b2.auction.id = a.id AND b2.bidder.id = :userId
                ) DESC
            """)
    List<Auction> findRecentlyBidByUser(@Param("userId") Long userId, Pageable pageable);

    @Query(value = """
                SELECT a FROM Auction a
                WHERE a.id IN (
                    SELECT b.auction.id FROM Bid b WHERE b.bidder.id = :userId
                )
                ORDER BY (
                    SELECT MAX(b2.createdAt) FROM Bid b2
                    WHERE b2.auction.id = a.id AND b2.bidder.id = :userId
                ) DESC
            """,
            countQuery = "SELECT COUNT(DISTINCT b.auction.id) FROM Bid b WHERE b.bidder.id = :userId")
    Page<Auction> findRecentlyBidByUserPaged(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"seller"})
    List<Auction> findByStatus(AuctionStatus status);

    long countByStatus(AuctionStatus status);

    @Modifying
    @Query("UPDATE Auction a SET a.status = 'CANCELLED' " +
            "WHERE a.seller.id = :sellerId " +
            "AND a.status IN ('DRAFT', 'SCHEDULED')")
    void cancelFutureAuctions(@Param("sellerId") Long sellerId);

    @Query("SELECT a FROM Auction a WHERE a.status = 'LIVE' " +
            "AND a.endTime > :now " +
            "AND a.endTime <= :targetTime " +
            "AND a.notifiedEndingSoon = false")
    List<Auction> findByNotifiedEndingSoonFalse(@Param("now") Instant now, @Param("targetTime") Instant targetTime);

    @Query("""
            SELECT
                COALESCE(SUM(CASE WHEN a.status = 'ENDED' THEN 1 ELSE 0 END), 0) AS totalWins,
                COALESCE(MAX(CASE WHEN a.status = 'ENDED' THEN a.currentPrice ELSE 0 END), 0) AS highestWinningBid,
                COALESCE(SUM(CASE WHEN a.status = 'ENDED' THEN a.currentPrice ELSE 0 END), 0) AS totalSpent,
                COALESCE(SUM(CASE WHEN a.status = 'LIVE' THEN 1 ELSE 0 END), 0) AS activeLeading
            FROM Auction a
            WHERE a.highestBidder.id = :bidderId
        """)
    AuctionWinProjection getAuctionWinMetrics(@Param("bidderId") Long bidderId);

    @Query("""
            SELECT
                COUNT(a) AS totalAuctionsCreated,
                COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN 1 ELSE 0 END), 0) AS totalAuctionsSold,
                COALESCE(SUM(CASE WHEN a.status IN ('LIVE', 'SCHEDULED') THEN 1 ELSE 0 END), 0) AS activeAuctions,
                COALESCE(SUM(CASE WHEN a.status IN ('ENDED', 'ENDED_NO_SALE') THEN 1 ELSE 0 END), 0) AS endedAuctions,
                COALESCE(SUM(CASE WHEN a.status = 'PENDING_REVIEW' THEN 1 ELSE 0 END), 0) AS pendingReviewCount,
                COALESCE(SUM(CASE WHEN a.status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejectedCount,
                COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.currentPrice ELSE 0 END), 0) AS totalRevenue,
                COALESCE(MAX(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.currentPrice ELSE 0 END), 0) AS highestSoldPrice
            FROM Auction a
            WHERE a.seller.id = :sellerId
        """)
    SellerAggregateProjection getSellerAggregateMetrics(@Param("sellerId") Long sellerId);

    @Query("""
             SELECT
                 FUNCTION('DATE_FORMAT', a.endTime, :timeFormat) AS periodLabel,
                 COUNT(a.id) AS auctionsCompleted,
                 COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.currentPrice ELSE 0 END), 0) AS revenue
             FROM Auction a
             WHERE a.seller.id = :sellerId AND a.status = 'ENDED' AND a.endTime >= :startDate
             GROUP BY FUNCTION('DATE_FORMAT', a.endTime, :timeFormat)
             ORDER BY FUNCTION('DATE_FORMAT', a.endTime, :timeFormat) ASC
        """)
    List<SellerChartProjection> getSellerRevenueChart(
            @Param("sellerId") Long sellerId,
            @Param("startDate") Instant startDate,
            @Param("timeFormat") String timeFormat
    );

    @Query("""
            SELECT
                COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.currentPrice ELSE 0 END), 0) AS totalPlatformRevenue,
                COALESCE(SUM(CASE WHEN a.status = 'LIVE' THEN 1 ELSE 0 END), 0) AS liveAuctions
            FROM Auction a
        """)
    KpiAuctionProjection getAdminKpiAuctionData();

    @Query("""
            SELECT
                COUNT(a) AS totalAuctions,
                COALESCE(SUM(CASE WHEN a.status = 'LIVE' THEN 1 ELSE 0 END), 0) AS liveCount,
                COALESCE(SUM(CASE WHEN a.status = 'SCHEDULED' THEN 1 ELSE 0 END), 0) AS scheduledCount,
                COALESCE(SUM(CASE WHEN a.status = 'PENDING_REVIEW' THEN 1 ELSE 0 END), 0) AS pendingReviewCount,
                COALESCE(SUM(CASE WHEN a.status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejectedCount,
                COALESCE(SUM(CASE WHEN a.status = 'ENDED' THEN 1 ELSE 0 END), 0) AS endedCount,
                COALESCE(SUM(CASE WHEN a.status = 'ENDED_NO_SALE' THEN 1 ELSE 0 END), 0) AS endedNoSaleCount,
                COALESCE(SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelledCount,
                COALESCE(SUM(CASE WHEN a.status = 'DRAFT' THEN 1 ELSE 0 END), 0) AS draftCount,
                COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN 1 ELSE 0 END), 0) AS endedWithHighestBidder,
                COALESCE(SUM(CASE WHEN a.privateMode = false THEN 1 ELSE 0 END), 0) AS publicCount,
                COALESCE(SUM(CASE WHEN a.privateMode = true THEN 1 ELSE 0 END), 0) AS privateCount
            FROM Auction a
        """)
    AuctionOverviewProjection getAdminAuctionOverviewData();

    @Query("""
            SELECT
                FUNCTION('DATE_FORMAT', a.endTime, :timeFormat) AS periodLabel,
                COALESCE(SUM(a.currentPrice), 0) AS revenue
            FROM Auction a
            WHERE a.status = 'ENDED' AND a.highestBidder IS NOT NULL AND a.endTime >= :startDate
            GROUP BY FUNCTION('DATE_FORMAT', a.endTime, :timeFormat)
            ORDER BY FUNCTION('DATE_FORMAT', a.endTime, :timeFormat) ASC
        """)
    List<RevenueProjection> getAdminRevenueChartData(
            @Param("startDate") Instant startDate,
            @Param("timeFormat") String timeFormat
    );

    @Query("""
            SELECT a FROM Auction a
            WHERE a.privateMode = false
            AND a.status IN ('LIVE', 'ENDED', 'ENDED_NO_SALE')
            AND EXISTS (SELECT b FROM Bid b WHERE b.auction.id = a.id AND b.createdAt >= :since)
            ORDER BY (
                SELECT COUNT(b2.id) FROM Bid b2 WHERE b2.auction.id = a.id AND b2.createdAt >= :since
            ) DESC
        """)
    List<Auction> findTrendingAuctions(@Param("since") Instant since, Pageable pageable);

    @Query("""
            SELECT a FROM Auction a
            WHERE a.privateMode = false
            AND a.status IN ('LIVE', 'SCHEDULED', 'ENDED', 'ENDED_NO_SALE')
            AND EXISTS (SELECT w FROM WishList w WHERE w.auction.id = a.id)
            ORDER BY (SELECT COUNT(w2.id) FROM WishList w2 WHERE w2.auction.id = a.id) DESC
        """)
    List<Auction> findMostWishlisted(Pageable pageable);
}

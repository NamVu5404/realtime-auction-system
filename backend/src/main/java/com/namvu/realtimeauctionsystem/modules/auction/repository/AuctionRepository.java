package com.namvu.realtimeauctionsystem.modules.auction.repository;

import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.common.enums.AuctionStatus;
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
    @Query("SELECT a FROM Auction a WHERE " +
            "(:status = 'LIVE' AND (a.status = 'LIVE' OR (a.status = 'SCHEDULED' AND a.startTime <= :oneHourFromNow))) OR " +
            "(:status = 'SCHEDULED' AND a.status = 'SCHEDULED' AND a.startTime > :oneHourFromNow) OR " +
            "(:status = 'ENDED' AND a.status = :status) " +
            "ORDER BY " +
            "CASE WHEN :status = 'LIVE' AND a.status = 'LIVE' THEN 0 " +
            "     WHEN :status = 'LIVE' AND a.status = 'SCHEDULED' THEN 1 " +
            "     ELSE 0 END ASC, " +
            "CASE WHEN :status = 'LIVE' THEN a.endTime END ASC, " +
            "CASE WHEN :status = 'ENDED' THEN a.endTime END DESC, " +
            "CASE WHEN :status = 'SCHEDULED' THEN a.startTime END ASC")
    Page<Auction> findByCustomStatus(
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
            "(:sellerId IS NULL OR s.id = :sellerId) " +
            "ORDER BY a.createdAt DESC")
    Page<Auction> filterAuctions(
            @Param("keyword") String keyword,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("status") AuctionStatus status,
            @Param("statusStr") String statusStr,
            @Param("sellerId") Long sellerId,
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

    @EntityGraph(attributePaths = {"seller"})
    List<Auction> findByStatus(AuctionStatus status);

    @Modifying
    @Query("UPDATE Auction a SET a.status = 'CANCELLED' " +
            "WHERE a.seller.id = :sellerId " +
            "AND a.status IN ('DRAFT', 'SCHEDULED')")
    void cancelFutureAuctions(@Param("sellerId") Long sellerId);
}

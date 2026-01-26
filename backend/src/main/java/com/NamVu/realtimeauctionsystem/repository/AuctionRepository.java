package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    @Query("SELECT a FROM Auction a WHERE " +
            "(:status = 'LIVE' AND (a.status = 'LIVE' OR (a.status = 'SCHEDULED' AND a.startTime <= :oneHourFromNow))) OR " +
            "(:status = 'SCHEDULED' AND a.status = 'SCHEDULED' AND a.startTime > :oneHourFromNow) OR " +
            "(:status NOT IN ('LIVE', 'SCHEDULED') AND a.status = :status) " +
            "ORDER BY " +
            "CASE WHEN :status = 'LIVE' AND a.status = 'LIVE' THEN 0 " +
            "     WHEN :status = 'LIVE' AND a.status = 'SCHEDULED' THEN 1 " +
            "     ELSE 0 END ASC, " +
            "CASE WHEN :status = 'LIVE' THEN a.endTime END ASC, " +
            "CASE WHEN :status = 'ENDED' THEN a.endTime END DESC, " +
            "CASE WHEN :status NOT IN ('LIVE', 'ENDED') THEN a.startTime END ASC")
    Page<Auction> findByCustomStatus(
            @Param("status") AuctionStatus status,
            @Param("oneHourFromNow") Instant oneHourFromNow,
            Pageable pageable
    );

    List<Auction> findByStatusAndStartTimeLessThanEqual(AuctionStatus status, Instant startTime);

    List<Auction> findByStatusAndEndTimeLessThanEqual(AuctionStatus status, Instant endTime);
}

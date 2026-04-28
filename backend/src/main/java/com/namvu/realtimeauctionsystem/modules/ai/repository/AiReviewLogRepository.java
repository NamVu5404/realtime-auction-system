package com.namvu.realtimeauctionsystem.modules.ai.repository;

import com.namvu.realtimeauctionsystem.common.constant.AiReviewDecision;
import com.namvu.realtimeauctionsystem.modules.ai.entity.AiReviewLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AiReviewLogRepository extends JpaRepository<AiReviewLog, Long> {
    @Query("SELECT l FROM AiReviewLog l JOIN FETCH l.auction a " +
            "WHERE (:auctionId IS NULL OR a.id = :auctionId) " +
            "AND (:decision IS NULL OR l.decision = :decision) " +
            "ORDER BY l.createdAt DESC")
    Page<AiReviewLog> filterLogs(@Param("auctionId") Long auctionId,
                                 @Param("decision") AiReviewDecision decision,
                                 Pageable pageable);

    @Query("SELECT l.decision, COUNT(l) FROM AiReviewLog l " +
            "GROUP BY l.decision")
    List<Object[]> countGroupedByDecision();
}

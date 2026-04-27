package com.namvu.realtimeauctionsystem.modules.ai.repository;

import com.namvu.realtimeauctionsystem.modules.ai.entity.AiReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiReviewLogRepository extends JpaRepository<AiReviewLog, Long> {
    Optional<AiReviewLog> findTopByAuctionIdOrderByCreatedAtDesc(Long auctionId);
}

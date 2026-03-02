package com.namvu.realtimeauctionsystem.repository;

import com.namvu.realtimeauctionsystem.entity.FraudLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudLogRepository extends JpaRepository<FraudLog, Long> {
    List<FraudLog> findByUserIdOrderByCreatedAtDesc(Long bidderId);
}

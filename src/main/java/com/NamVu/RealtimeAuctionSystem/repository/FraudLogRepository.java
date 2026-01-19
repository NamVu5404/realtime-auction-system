package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.entity.FraudLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FraudLogRepository extends JpaRepository<FraudLog, Long> {
}

package com.namvu.realtimeauctionsystem.modules.fraud.repository;

import com.namvu.realtimeauctionsystem.modules.fraud.entity.FraudLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FraudLogRepository extends JpaRepository<FraudLog, Long> {
}

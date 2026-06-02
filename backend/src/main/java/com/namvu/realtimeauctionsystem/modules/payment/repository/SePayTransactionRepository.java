package com.namvu.realtimeauctionsystem.modules.payment.repository;

import com.namvu.realtimeauctionsystem.modules.payment.entity.SePayTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SePayTransactionRepository extends JpaRepository<SePayTransaction, Long> {
    boolean existsBySePayId(Long sePayId);
}

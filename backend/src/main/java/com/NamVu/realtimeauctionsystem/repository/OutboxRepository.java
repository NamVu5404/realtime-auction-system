package com.namvu.realtimeauctionsystem.repository;

import com.namvu.realtimeauctionsystem.entity.Outbox;
import com.namvu.realtimeauctionsystem.enums.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface OutboxRepository extends JpaRepository<Outbox, Long> {
    List<Outbox> findByStatusOrderByCreatedAtAsc(OutboxStatus status, Pageable pageable);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM outbox WHERE status = 'SENT' LIMIT :batchSize", nativeQuery = true)
    int deleteSentRecordsBatch(@Param("batchSize") int batchSize);
}

package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.entity.UserTracking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserTrackingRepository extends JpaRepository<UserTracking, Long> {
    Page<UserTracking> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}

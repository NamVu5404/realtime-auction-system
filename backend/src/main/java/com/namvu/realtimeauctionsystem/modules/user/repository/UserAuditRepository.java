package com.namvu.realtimeauctionsystem.modules.user.repository;

import com.namvu.realtimeauctionsystem.modules.user.entity.UserAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAuditRepository extends JpaRepository<UserAudit, Long> {
    Page<UserAudit> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}

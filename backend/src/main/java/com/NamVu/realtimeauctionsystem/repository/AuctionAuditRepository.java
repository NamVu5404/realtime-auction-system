package com.namvu.realtimeauctionsystem.repository;

import com.namvu.realtimeauctionsystem.entity.AuctionAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionAuditRepository extends JpaRepository<AuctionAudit, Long> {
    Page<AuctionAudit> findByAuctionIdOrderByCreatedAtDesc(Long auctionId, Pageable pageable);
}

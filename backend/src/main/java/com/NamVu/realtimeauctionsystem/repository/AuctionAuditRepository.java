package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.entity.AuctionAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionAuditRepository extends JpaRepository<AuctionAudit, Long> {
    Page<AuctionAudit> findByAuctionIdOrderByCreatedAtDesc(Long auctionId, Pageable pageable);
}

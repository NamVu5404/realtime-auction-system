package com.namvu.realtimeauctionsystem.modules.auction.repository;

import com.namvu.realtimeauctionsystem.modules.auction.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.common.constant.AuctionActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuctionAuditRepository extends JpaRepository<AuctionAudit, Long> {
    Page<AuctionAudit> findByAuctionIdOrderByCreatedAtDesc(Long auctionId, Pageable pageable);

    Optional<AuctionAudit> findFirstByAuctionIdAndActionTypeOrderByCreatedAtDesc(Long auctionId, AuctionActionType actionType);
}

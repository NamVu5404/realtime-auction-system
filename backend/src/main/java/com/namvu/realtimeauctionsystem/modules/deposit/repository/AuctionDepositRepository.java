package com.namvu.realtimeauctionsystem.modules.deposit.repository;

import com.namvu.realtimeauctionsystem.common.constant.DepositStatus;
import com.namvu.realtimeauctionsystem.modules.deposit.entity.AuctionDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionDepositRepository extends JpaRepository<AuctionDeposit, Long> {

    boolean existsByAuctionIdAndUserId(Long auctionId, Long userId);

    Optional<AuctionDeposit> findByAuctionIdAndUserId(Long auctionId, Long userId);

    List<AuctionDeposit> findByAuctionIdAndStatus(Long auctionId, DepositStatus status);

    List<AuctionDeposit> findByAuctionIdAndStatusAndUserIdNot(Long auctionId, DepositStatus status, Long excludeUserId);

    List<AuctionDeposit> findByUserId(Long userId);

    List<AuctionDeposit> findByAuctionId(Long auctionId);
}

package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
}

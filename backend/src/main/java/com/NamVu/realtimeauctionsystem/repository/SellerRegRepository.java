package com.namvu.realtimeauctionsystem.repository;

import com.namvu.realtimeauctionsystem.entity.SellerRegistration;
import com.namvu.realtimeauctionsystem.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRegRepository extends JpaRepository<SellerRegistration, Long> {
    Optional<SellerRegistration> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = "user")
    Page<SellerRegistration> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByUser_IdAndStatus(Long userId, RequestStatus status);
}

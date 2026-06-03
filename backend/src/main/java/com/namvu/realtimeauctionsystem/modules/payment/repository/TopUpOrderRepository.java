package com.namvu.realtimeauctionsystem.modules.payment.repository;

import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.modules.payment.entity.TopUpOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TopUpOrderRepository extends JpaRepository<TopUpOrder, Long> {
    Optional<TopUpOrder> findByInvoiceNumberAndStatus(String invoiceNumber, TopUpOrderStatus status);

    Optional<TopUpOrder> findFirstByUser_IdAndStatusOrderByCreatedAtDesc(Long userId, TopUpOrderStatus status);

    @Query("""
            SELECT o FROM TopUpOrder o
            WHERE o.user.id = :userId
              AND o.status IN :statuses
              AND (:from IS NULL OR o.createdAt >= :from)
              AND (:to   IS NULL OR o.createdAt <= :to)
            ORDER BY o.createdAt DESC
            """)
    Page<TopUpOrder> findHistory(
            @Param("userId") Long userId,
            @Param("statuses") List<TopUpOrderStatus> statuses,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);

    @Query("""
            SELECT o FROM TopUpOrder o JOIN o.user u
            WHERE (:keyword IS NULL
                   OR LOWER(u.email)         LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(o.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:status IS NULL OR o.status   = :status)
              AND (:from   IS NULL OR o.createdAt >= :from)
              AND (:to     IS NULL OR o.createdAt <= :to)
            ORDER BY o.createdAt DESC
            """)
    Page<TopUpOrder> findAdminHistory(
            @Param("keyword") String keyword,
            @Param("status") TopUpOrderStatus status,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);
}

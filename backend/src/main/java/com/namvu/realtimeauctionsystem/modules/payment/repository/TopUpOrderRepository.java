package com.namvu.realtimeauctionsystem.modules.payment.repository;

import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.modules.payment.entity.TopUpOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TopUpOrderRepository extends JpaRepository<TopUpOrder, Long> {
    Optional<TopUpOrder> findByInvoiceNumberAndStatus(String invoiceNumber, TopUpOrderStatus status);

    Optional<TopUpOrder> findFirstByUser_IdAndStatusOrderByCreatedAtDesc(Long userId, TopUpOrderStatus status);
}

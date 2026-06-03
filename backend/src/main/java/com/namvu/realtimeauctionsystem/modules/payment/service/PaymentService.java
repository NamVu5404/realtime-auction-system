package com.namvu.realtimeauctionsystem.modules.payment.service;

import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CheckoutFormResponse;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CreateTopUpOrderRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.SePayWebhookRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.AdminTopUpHistoryResponse;
import com.namvu.realtimeauctionsystem.modules.payment.dto.TopUpHistoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

public interface PaymentService {
    void processWebhook(SePayWebhookRequest request);

    CheckoutFormResponse createTopUpOrder(Long userId, CreateTopUpOrderRequest request);

    Page<TopUpHistoryResponse> getTopUpHistory(Long userId, TopUpOrderStatus status, Instant from, Instant to, Pageable pageable);

    Page<AdminTopUpHistoryResponse> getAdminTopUpHistory(String keyword, TopUpOrderStatus status, Instant from, Instant to, Pageable pageable);
}

package com.namvu.realtimeauctionsystem.modules.payment.service;

import com.namvu.realtimeauctionsystem.modules.payment.dto.CheckoutFormResponse;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CreateTopUpOrderRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.SePayWebhookRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.TopUpInfoResponse;

public interface PaymentService {
    void processWebhook(SePayWebhookRequest request);

    CheckoutFormResponse createTopUpOrder(Long userId, CreateTopUpOrderRequest request);

    TopUpInfoResponse getTopUpInfo(Long userId);
}

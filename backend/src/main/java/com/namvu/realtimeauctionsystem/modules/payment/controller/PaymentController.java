package com.namvu.realtimeauctionsystem.modules.payment.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.SuccessCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CheckoutFormResponse;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CreateTopUpOrderRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.SePayWebhookRequest;
import com.namvu.realtimeauctionsystem.modules.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/webhook/sepay")
    public ResponseEntity<Map<String, Boolean>> sePayWebhook(@RequestBody SePayWebhookRequest request) {
        paymentService.processWebhook(request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/payments/top-up")
    public ApiResponse<CheckoutFormResponse> createTopUpOrder(@Valid @RequestBody CreateTopUpOrderRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.of(SuccessCode.CREATED, paymentService.createTopUpOrder(userId, request));
    }
}

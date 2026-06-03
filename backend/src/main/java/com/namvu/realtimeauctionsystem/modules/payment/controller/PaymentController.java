package com.namvu.realtimeauctionsystem.modules.payment.controller;

import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.SuccessCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CheckoutFormResponse;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CreateTopUpOrderRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.SePayWebhookRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.TopUpHistoryResponse;
import com.namvu.realtimeauctionsystem.modules.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
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

    @GetMapping("/payments/top-up/history")
    public ApiResponse<Page<TopUpHistoryResponse>> getTopUpHistory(
            @RequestParam(required = false) TopUpOrderStatus status,
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Instant fromInstant = from != null ? Instant.ofEpochMilli(from) : null;
        Instant toInstant = to != null ? Instant.ofEpochMilli(to) : null;
        Page<TopUpHistoryResponse> result = paymentService.getTopUpHistory(
                userId, status, fromInstant, toInstant, PageRequest.of(page, size));
        return ApiResponse.of(SuccessCode.WALLET_FETCHED, result);
    }
}

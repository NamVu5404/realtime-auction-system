package com.namvu.realtimeauctionsystem.modules.payment.controller;

import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.SuccessCode;
import com.namvu.realtimeauctionsystem.modules.payment.dto.AdminTopUpHistoryResponse;
import com.namvu.realtimeauctionsystem.modules.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/v1/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping("/top-up/history")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Page<AdminTopUpHistoryResponse>> getTopUpHistory(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TopUpOrderStatus status,
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Instant fromInstant = from != null ? Instant.ofEpochMilli(from) : null;
        Instant toInstant   = to   != null ? Instant.ofEpochMilli(to)   : null;

        Page<AdminTopUpHistoryResponse> result = paymentService.getAdminTopUpHistory(
                keyword, status, fromInstant, toInstant, PageRequest.of(page, size));

        return ApiResponse.of(SuccessCode.WALLET_FETCHED, result);
    }
}

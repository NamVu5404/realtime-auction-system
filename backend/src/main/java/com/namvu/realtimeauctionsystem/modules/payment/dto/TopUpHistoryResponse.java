package com.namvu.realtimeauctionsystem.modules.payment.dto;

import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class TopUpHistoryResponse {
    private Long id;
    private String invoiceNumber;
    private BigDecimal amount;
    private TopUpOrderStatus status;
    private Instant createdAt;
}

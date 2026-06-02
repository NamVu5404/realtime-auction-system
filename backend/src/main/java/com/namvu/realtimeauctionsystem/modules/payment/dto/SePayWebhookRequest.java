package com.namvu.realtimeauctionsystem.modules.payment.dto;

import lombok.Data;

@Data
public class SePayWebhookRequest {
    private Long id;
    private String gateway;
    private String transactionDate;
    private String accountNumber;
    private String subAccount;
    private String code;
    private String content;
    private String transferType;
    private String description;
    private Long transferAmount;
    private Long accumulated;
    private String referenceCode;
}

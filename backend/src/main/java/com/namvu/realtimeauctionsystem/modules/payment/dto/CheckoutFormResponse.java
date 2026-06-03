package com.namvu.realtimeauctionsystem.modules.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutFormResponse {
    private String checkoutUrl;
    // 11 signed fields — theo đúng thứ tự ký
    private String merchant;
    private String operation;
    private String paymentMethod;
    private String orderAmount;
    private String currency;
    private String orderInvoiceNumber;
    private String orderDescription;
    private String customerId;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
    private String signature;
}

package com.namvu.realtimeauctionsystem.modules.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutFormResponse {
    private String checkoutUrl;        // action URL để frontend submit form
    private String orderAmount;
    private String merchant;
    private String currency;
    private String operation;
    private String orderDescription;
    private String orderInvoiceNumber;
    private String customerId;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
    private String signature;
}

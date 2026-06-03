package com.namvu.realtimeauctionsystem.modules.payment.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

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

    // IPN: order_invoice_number nằm trong nested "order" object (nếu có)
    private OrderInfo order;

    @JsonAlias({"order_invoice_number", "orderInvoiceNumber"})
    private String orderInvoiceNumberRaw;

    // ORDER_PAID checkout webhook: customer.customer_id là userId nội bộ
    private CustomerInfo customer;

    // ORDER_PAID checkout webhook: transaction details
    private TransactionInfo transaction;

    public String getOrderInvoiceNumber() {
        if (order != null && order.getOrderInvoiceNumber() != null && !order.getOrderInvoiceNumber().isBlank()) {
            return order.getOrderInvoiceNumber();
        }
        return orderInvoiceNumberRaw;
    }

    public Long getCustomerIdFromPayload() {
        return customer != null ? customer.getCustomerId() : null;
    }

    private final Map<String, Object> extra = new LinkedHashMap<>();

    @JsonAnySetter
    public void setExtra(String key, Object value) {
        extra.put(key, value);
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrderInfo {
        @JsonAlias({"order_invoice_number", "orderInvoiceNumber"})
        private String orderInvoiceNumber;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CustomerInfo {
        @JsonAlias({"customer_id", "customerId"})
        private Long customerId;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TransactionInfo {
        private String id; // UUID của SePay
        @JsonAlias({"transaction_id", "transactionId"})
        private String transactionId; // bank reference, e.g. FT26155723007901
        @JsonAlias({"payment_method", "paymentMethod"})
        private String paymentMethod; // BANK_TRANSFER
        @JsonAlias({"transaction_amount", "transactionAmount"})
        private Long transactionAmount;
        @JsonAlias({"transaction_type", "transactionType"})
        private String transactionType; // PAYMENT
    }
}

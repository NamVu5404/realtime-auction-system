package com.namvu.realtimeauctionsystem.modules.payment.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.MessagingConstant;
import com.namvu.realtimeauctionsystem.common.constant.NotificationConstant;
import com.namvu.realtimeauctionsystem.common.constant.SePayStatus;
import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.infrastructure.config.SePayProperties;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CheckoutFormResponse;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CreateTopUpOrderRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.SePayWebhookRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.TopUpInfoResponse;
import com.namvu.realtimeauctionsystem.modules.payment.entity.SePayTransaction;
import com.namvu.realtimeauctionsystem.modules.payment.entity.TopUpOrder;
import com.namvu.realtimeauctionsystem.modules.payment.repository.SePayTransactionRepository;
import com.namvu.realtimeauctionsystem.modules.payment.repository.TopUpOrderRepository;
import com.namvu.realtimeauctionsystem.modules.payment.service.PaymentService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import com.namvu.realtimeauctionsystem.modules.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final SePayTransactionRepository sePayTransactionRepository;
    private final TopUpOrderRepository topUpOrderRepository;
    private final UserService userService;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final SePayProperties sePayProperties;

    // Thứ tự field ký phải đúng theo docs SePay - không được đổi thứ tự
    private static final String[] SIGNED_FIELDS = {
        "order_amount", "merchant", "currency", "operation",
        "order_description", "order_invoice_number",
        "customer_id", "payment_method",
        "success_url", "error_url", "cancel_url"
    };

    private static final String MANUAL_CODE_PREFIX = "AP";

    @Override
    @Transactional
    public CheckoutFormResponse createTopUpOrder(Long userId, CreateTopUpOrderRequest request) {
        User user = userService.getUserById(userId);
        String invoiceNumber = buildInvoiceNumber(userId);

        TopUpOrder order = TopUpOrder.builder()
            .user(user)
            .invoiceNumber(invoiceNumber)
            .amount(BigDecimal.valueOf(request.getAmount()))
            .status(TopUpOrderStatus.PENDING)
            .build();
        topUpOrderRepository.save(order);

        String frontendUrl = sePayProperties.getFrontendUrl();
        Map<String, String> formFields = new LinkedHashMap<>();
        formFields.put("order_amount", String.valueOf(request.getAmount()));
        formFields.put("merchant", sePayProperties.getMerchantId());
        formFields.put("currency", "VND");
        formFields.put("operation", "PURCHASE");
        formFields.put("order_description", "Nạp tiền vào ví AuctionPro - " + invoiceNumber);
        formFields.put("order_invoice_number", invoiceNumber);
        formFields.put("customer_id", String.valueOf(userId));
        formFields.put("success_url", frontendUrl + "/account/wallet?topup=success");
        formFields.put("error_url", frontendUrl + "/account/wallet?topup=error");
        formFields.put("cancel_url", frontendUrl + "/account/wallet?topup=cancelled");

        String signature = buildSignature(formFields);

        return CheckoutFormResponse.builder()
            .checkoutUrl(sePayProperties.getCheckoutUrl())
            .orderAmount(formFields.get("order_amount"))
            .merchant(formFields.get("merchant"))
            .currency("VND")
            .operation("PURCHASE")
            .orderDescription(formFields.get("order_description"))
            .orderInvoiceNumber(invoiceNumber)
            .customerId(String.valueOf(userId))
            .successUrl(formFields.get("success_url"))
            .errorUrl(formFields.get("error_url"))
            .cancelUrl(formFields.get("cancel_url"))
            .signature(signature)
            .build();
    }

    @Override
    @Async(MessagingConstant.Executor.DEPOSIT_EXECUTOR)
    @Transactional
    public void processWebhook(SePayWebhookRequest req) {
        if (req.getId() == null) {
            log.warn("[SePay] Received webhook with null id, ignoring");
            return;
        }

        // Dedup check — UNIQUE constraint on sepay_id is the DB-level safety net
        if (sePayTransactionRepository.existsBySePayId(req.getId())) {
            log.warn("[SePay] Duplicate sePayId={}, skipping", req.getId());
            return;
        }

        if (!"in".equals(req.getTransferType())) {
            saveTransaction(req, null, SePayStatus.IGNORED);
            return;
        }

        // Luồng 1: Checkout order — code khớp invoiceNumber
        Optional<TopUpOrder> orderOpt = req.getCode() != null
            ? topUpOrderRepository.findByInvoiceNumberAndStatus(req.getCode(), TopUpOrderStatus.PENDING)
            : Optional.empty();

        if (orderOpt.isPresent()) {
            processCheckoutPayment(req, orderOpt.get());
            return;
        }

        // Luồng 2: Manual bank transfer — code khớp AP{userId}
        Long userId = parseManualCode(req.getCode());
        if (userId == null) {
            log.info("[SePay] id={} - no matching code '{}', IGNORED", req.getId(), req.getCode());
            saveTransaction(req, null, SePayStatus.IGNORED);
            return;
        }

        User user;
        try {
            user = userService.getUserById(userId);
        } catch (Exception e) {
            log.info("[SePay] id={} - userId={} not found, IGNORED", req.getId(), userId);
            saveTransaction(req, null, SePayStatus.IGNORED);
            return;
        }

        creditAndNotify(req, user, req.getTransferAmount());
    }

    @Override
    public TopUpInfoResponse getTopUpInfo(Long userId) {
        String transferCode = buildManualCode(userId);
        return TopUpInfoResponse.builder()
            .transferCode(transferCode)
            .bankName(sePayProperties.getBankName())
            .accountNumber(sePayProperties.getAccountNumber())
            .accountHolder(sePayProperties.getAccountHolder())
            .transferNote("Nhập đúng mã " + transferCode + " vào nội dung chuyển khoản")
            .build();
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    private void processCheckoutPayment(SePayWebhookRequest req, TopUpOrder order) {
        try {
            walletService.creditFunds(order.getUser().getId(), order.getAmount());
            order.setStatus(TopUpOrderStatus.COMPLETED);
            topUpOrderRepository.save(order);
            saveTransaction(req, order.getUser(), SePayStatus.CREDITED);
            log.info("[SePay] id={} - checkout order {} completed for userId={}",
                req.getId(), order.getInvoiceNumber(), order.getUser().getId());
            pushTopUpNotification(order.getUser().getId(), order.getAmount().longValue());
        } catch (Exception e) {
            log.error("[SePay] id={} - checkout credit failed for order={}", req.getId(), order.getInvoiceNumber(), e);
            order.setStatus(TopUpOrderStatus.FAILED);
            topUpOrderRepository.save(order);
            saveTransaction(req, order.getUser(), SePayStatus.FAILED);
        }
    }

    private void creditAndNotify(SePayWebhookRequest req, User user, Long amount) {
        try {
            walletService.creditFunds(user.getId(), BigDecimal.valueOf(amount));
        } catch (Exception e) {
            log.error("[SePay] id={} - creditFunds failed for userId={}", req.getId(), user.getId(), e);
            saveTransaction(req, user, SePayStatus.FAILED);
            return;
        }
        saveTransaction(req, user, SePayStatus.CREDITED);
        log.info("[SePay] id={} - manual transfer credited {} VND to userId={}", req.getId(), amount, user.getId());
        pushTopUpNotification(user.getId(), amount);
    }

    private void pushTopUpNotification(Long userId, Long amount) {
        try {
            notificationService.createAndPushNotification(
                userId,
                NotificationConstant.WALLET_TOP_UP,
                NotificationConstant.WALLET_TOP_UP.buildContent(amount),
                NotificationConstant.WALLET_TOP_UP.getRedirectUrl()
            );
        } catch (Exception e) {
            log.warn("[SePay] notification failed for userId={}", userId, e);
        }
    }

    private void saveTransaction(SePayWebhookRequest req, User user, SePayStatus status) {
        SePayTransaction tx = SePayTransaction.builder()
            .sePayId(req.getId())
            .user(user)
            .gateway(req.getGateway() != null ? req.getGateway() : "")
            .transferAmount(req.getTransferAmount() != null ? req.getTransferAmount() : 0L)
            .transferType(req.getTransferType())
            .code(req.getCode())
            .content(req.getContent())
            .referenceCode(req.getReferenceCode())
            .status(status)
            .build();
        sePayTransactionRepository.save(tx);
    }

    private String buildSignature(Map<String, String> fields) {
        StringBuilder sb = new StringBuilder();
        for (String field : SIGNED_FIELDS) {
            String value = fields.get(field);
            if (value != null && !value.isEmpty()) {
                if (sb.length() > 0) sb.append(',');
                sb.append(field).append('=').append(value);
            }
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                sePayProperties.getSecretKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build SePay signature", e);
        }
    }

    private String buildInvoiceNumber(Long userId) {
        return "TOPUP-" + userId + "-" + System.currentTimeMillis();
    }

    private String buildManualCode(Long userId) {
        return MANUAL_CODE_PREFIX + String.format("%06d", userId);
    }

    private Long parseManualCode(String code) {
        if (code == null || !code.startsWith(MANUAL_CODE_PREFIX)) return null;
        try {
            return Long.parseLong(code.substring(MANUAL_CODE_PREFIX.length()));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

package com.namvu.realtimeauctionsystem.modules.payment.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.MessagingConstant;
import com.namvu.realtimeauctionsystem.common.constant.NotificationConstant;
import com.namvu.realtimeauctionsystem.common.constant.SePayStatus;
import com.namvu.realtimeauctionsystem.common.constant.TopUpOrderStatus;
import com.namvu.realtimeauctionsystem.common.utils.MoneyUtils;
import com.namvu.realtimeauctionsystem.infrastructure.config.SePayProperties;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CheckoutFormResponse;
import com.namvu.realtimeauctionsystem.modules.payment.dto.CreateTopUpOrderRequest;
import com.namvu.realtimeauctionsystem.modules.payment.dto.SePayWebhookRequest;
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

    // Đảm bảo ký đúng thứ tự
    private static final String[] SIGNED_FIELDS = {
            "merchant", "operation", "payment_method",
            "order_amount", "currency", "order_invoice_number",
            "order_description", "customer_id",
            "success_url", "error_url", "cancel_url"
    };

    @Override
    @Transactional
    public CheckoutFormResponse createTopUpOrder(Long userId, CreateTopUpOrderRequest request) {
        User user = userService.getUserById(userId);
        String invoiceNumber = buildInvoiceNumber(userId);

        // Expire bất kỳ PENDING order cũ nào trước khi tạo mới,
        // đảm bảo mỗi user chỉ có tối đa 1 PENDING order tại một thời điểm.
        topUpOrderRepository
                .findFirstByUser_IdAndStatusOrderByCreatedAtDesc(userId, TopUpOrderStatus.PENDING)
                .ifPresent(old -> {
                    old.setStatus(TopUpOrderStatus.EXPIRED);
                    topUpOrderRepository.save(old);
                });

        TopUpOrder order = TopUpOrder.builder()
            .user(user)
            .invoiceNumber(invoiceNumber)
            .amount(BigDecimal.valueOf(request.getAmount()))
            .status(TopUpOrderStatus.PENDING)
            .build();
        topUpOrderRepository.save(order);

        String merchantId = sePayProperties.getMerchantId();
        String frontendUrl = sePayProperties.getFrontendUrl();
        String email = user.getEmail();

        // 11 signed fields theo đúng thứ tự SIGNED_FIELDS
        Map<String, String> formFields = new LinkedHashMap<>();
        formFields.put("merchant", merchantId);
        formFields.put("operation", "PURCHASE");
        formFields.put("payment_method", "BANK_TRANSFER");
        formFields.put("order_amount", String.valueOf(request.getAmount()));
        formFields.put("currency", "VND");
        formFields.put("order_invoice_number", invoiceNumber);
        formFields.put("order_description", "Top up to wallet " + email);
        formFields.put("customer_id", String.valueOf(userId));
        formFields.put("success_url", frontendUrl + "/account/wallet?topup=success");
        formFields.put("error_url", frontendUrl + "/account/wallet?topup=error");
        formFields.put("cancel_url", frontendUrl + "/account/wallet?topup=cancelled");

        String signature = buildSignature(formFields);

        return CheckoutFormResponse.builder()
                .checkoutUrl(sePayProperties.getCheckoutUrl())
                .merchant(merchantId)
                .operation("PURCHASE")
                .paymentMethod("BANK_TRANSFER")
                .orderAmount(formFields.get("order_amount"))
                .currency("VND")
                .orderInvoiceNumber(invoiceNumber)
                .orderDescription(formFields.get("order_description"))
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
        Long customerId = req.getCustomerIdFromPayload();
        if (customerId == null) {
            log.warn("[SePay] IPN missing customer_id, ignoring");
            return;
        }
        Optional<TopUpOrder> orderOpt = topUpOrderRepository
                .findFirstByUser_IdAndStatusOrderByCreatedAtDesc(customerId, TopUpOrderStatus.PENDING);
        if (orderOpt.isEmpty()) {
            log.warn("[SePay] IPN - no pending order for customerId={}", customerId);
            return;
        }
        processCheckoutPayment(req, orderOpt.get());
    }

    private void processCheckoutPayment(SePayWebhookRequest req, TopUpOrder order) {
        try {
            walletService.creditFunds(order.getUser().getId(), order.getAmount());
            order.setStatus(TopUpOrderStatus.COMPLETED);
            topUpOrderRepository.save(order);
            saveTransaction(req, order.getUser(), SePayStatus.CREDITED);
            log.info("[SePay] ORDER_PAID - order={} credited for userId={}",
                    order.getInvoiceNumber(), order.getUser().getId());
            pushTopUpNotification(order.getUser().getId(), order.getAmount().longValue());
        } catch (Exception e) {
            log.error("[SePay] ORDER_PAID - credit failed for order={}", order.getInvoiceNumber(), e);
            order.setStatus(TopUpOrderStatus.FAILED);
            topUpOrderRepository.save(order);
            saveTransaction(req, order.getUser(), SePayStatus.FAILED);
        }
    }

    private void pushTopUpNotification(Long userId, Long amount) {
        try {
            notificationService.createAndPushNotification(
                    userId,
                    NotificationConstant.WALLET_TOP_UP,
                    NotificationConstant.WALLET_TOP_UP.buildContent(MoneyUtils.format(BigDecimal.valueOf(amount))),
                    NotificationConstant.WALLET_TOP_UP.getRedirectUrl()
            );
        } catch (Exception e) {
            log.warn("[SePay] notification failed for userId={}", userId, e);
        }
    }

    private void saveTransaction(SePayWebhookRequest req, User user, SePayStatus status) {
        SePayWebhookRequest.TransactionInfo txInfo = req.getTransaction();

        SePayTransaction tx = SePayTransaction.builder()
                .user(user)
                .gateway(txInfo != null && txInfo.getPaymentMethod() != null ? txInfo.getPaymentMethod() : "")
                .transferAmount(txInfo != null && txInfo.getTransactionAmount() != null ? txInfo.getTransactionAmount() : 0L)
                .transferType(txInfo != null ? txInfo.getTransactionType() : null)
                .code(txInfo != null ? txInfo.getId() : null)
                .referenceCode(txInfo != null ? txInfo.getTransactionId() : null)
                .status(status)
                .build();
        sePayTransactionRepository.save(tx);
    }

    private String buildSignature(Map<String, String> fields) {
        StringBuilder sb = new StringBuilder();
        for (String field : SIGNED_FIELDS) {
            String value = fields.get(field);
            if (value != null && !value.isEmpty()) {
                if (!sb.isEmpty()) sb.append(',');
                sb.append(field).append('=').append(value);
            }
        }
        log.debug("[SePay] Signed string: {}", sb);
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    sePayProperties.getSecretKey().trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build SePay signature", e);
        }
    }

    private String buildInvoiceNumber(Long userId) {
        return "TOPUP-" + userId + "-" + System.currentTimeMillis();
    }

}

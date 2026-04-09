package com.namvu.realtimeauctionsystem.modules.mail.service.impl;

import com.namvu.realtimeauctionsystem.modules.mail.dto.EmailContext;
import com.namvu.realtimeauctionsystem.modules.mail.service.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.Executor.MAIL_EXECUTOR;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    private static final String FULL_NAME = "fullName";
    private static final String REASON = "reason";

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async(MAIL_EXECUTOR)
    @Override
    public void sendWelcomeEmail(String toEmail, String fullName) {
        sendEmail(EmailContext.builder()
                .to(toEmail)
                .subject("Welcome to AuctionPro!")
                .template("mail/welcome-email")
                .variables(Map.of(FULL_NAME, fullName))
                .build());
    }

    @Async(MAIL_EXECUTOR)
    @Override
    public void sendSellerApprovalEmail(String toEmail, String fullName) {
        sendEmail(EmailContext.builder()
                .to(toEmail)
                .subject("Congratulations! Your Seller Account is Approved")
                .template("mail/seller-approval")
                .variables(Map.of(FULL_NAME, fullName))
                .build());
    }

    @Async(MAIL_EXECUTOR)
    @Override
    public void sendSellerRejectionEmail(String toEmail, String fullName, String reason) {
        sendEmail(EmailContext.builder()
                .to(toEmail)
                .subject("Update on Your Seller Application")
                .template("mail/seller-rejection")
                .variables(Map.of(FULL_NAME, fullName, REASON, reason))
                .build());
    }

    @Async(MAIL_EXECUTOR)
    @Override
    public void sendSellerRevocationEmail(String toEmail, String fullName, String reason) {
        sendEmail(EmailContext.builder()
                .to(toEmail)
                .subject("Important: Your Seller Role has been Revoked")
                .template("mail/seller-revocation")
                .variables(Map.of(FULL_NAME, fullName, REASON, reason))
                .build());
    }

    @Async(MAIL_EXECUTOR)
    @Override
    public void sendUserBlockEmail(String toEmail, String fullName, String reason) {
        sendEmail(EmailContext.builder()
                .to(toEmail)
                .subject("Account Notification: Your Account has been Blocked")
                .template("mail/user-block")
                .variables(Map.of(FULL_NAME, fullName, REASON, reason))
                .build());
    }

    private void sendEmail(EmailContext emailContext) {
        log.info("Sending email to {} with template {}", emailContext.getTo(), emailContext.getTemplate());
        try {
            Context context = new Context();
            if (emailContext.getVariables() != null) {
                context.setVariables(emailContext.getVariables());
            }

            String htmlContent = templateEngine.process(emailContext.getTemplate(), context);

            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(emailContext.getTo());
            helper.setSubject(emailContext.getSubject());
            helper.setText(htmlContent, true);

            javaMailSender.send(message);
            log.info("Email sent successfully to {}", emailContext.getTo());
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", emailContext.getTo(), e);
        } catch (Exception e) {
            log.error("Unexpected error while sending email to {}", emailContext.getTo(), e);
        }
    }
}

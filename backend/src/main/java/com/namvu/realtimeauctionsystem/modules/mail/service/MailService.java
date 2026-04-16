package com.namvu.realtimeauctionsystem.modules.mail.service;

import java.math.BigDecimal;

public interface MailService {
    void sendWelcomeEmail(String toEmail, String fullName);

    void sendSellerApprovalEmail(String toEmail, String fullName);

    void sendSellerRejectionEmail(String toEmail, String fullName, String reason);

    void sendSellerRevocationEmail(String toEmail, String fullName, String reason);

    void sendUserBlockEmail(String toEmail, String fullName, String reason);

    void sendAuctionWinnerEmail(String toEmail, String fullName, String auctionTitle, BigDecimal winningBid, Long auctionId);
}

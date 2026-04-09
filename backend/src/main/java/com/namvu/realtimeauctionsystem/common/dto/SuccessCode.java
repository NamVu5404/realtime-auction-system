package com.namvu.realtimeauctionsystem.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
public enum SuccessCode {

    // Common (10xx)
    OK(1000, "Success", HttpStatus.OK),
    CREATED(1001, "Created successfully", HttpStatus.CREATED),
    UPDATED(1002, "Updated successfully", HttpStatus.OK),
    DELETED(1003, "Deleted successfully", HttpStatus.OK),

    // Auth (11xx)
    LOGIN(1100, "Login successfully", HttpStatus.OK),
    LOGOUT(1101, "Logout successfully", HttpStatus.OK),
    TOKEN_REFRESH(1102, "Token refreshed successfully", HttpStatus.OK),
    TOKEN_VERIFIED(1103, "Token verified successfully", HttpStatus.OK),

    // User & Profile (12xx)
    PROFILE_UPDATED(1200, "Profile updated successfully", HttpStatus.OK),
    AVATAR_UPLOADED(1201, "Avatar uploaded successfully", HttpStatus.OK),
    USER_BLOCKED(1202, "User has been blocked", HttpStatus.OK),
    USER_UNBLOCKED(1203, "User has been unblocked", HttpStatus.OK),

    // Auction (13xx)
    AUCTION_CREATED(1300, "Auction created successfully", HttpStatus.CREATED),
    AUCTION_UPDATED(1301, "Auction updated successfully", HttpStatus.OK),
    AUCTION_CANCELLED(1302, "Auction cancelled successfully", HttpStatus.OK),
    DRAFT_AUCTION_UPDATED(1303, "Draft auction updated", HttpStatus.OK),
    SCHEDULED_AUCTION_UPDATED(1304, "Scheduled auction updated", HttpStatus.OK),

    // Bid (14xx)
    BID_PLACED(1400, "Bid placed successfully", HttpStatus.CREATED),

    // File (15xx)
    FILE_UPLOADED(1500, "File uploaded successfully", HttpStatus.CREATED),
    FILE_DELETED(1501, "File deleted successfully", HttpStatus.OK),

    // Seller & Registration (16xx)
    SELLER_REG_SUBMITTED(1600, "Seller registration submitted", HttpStatus.CREATED),
    SELLER_REG_APPROVED(1601, "Seller registration approved", HttpStatus.OK),
    SELLER_REG_REJECTED(1602, "Seller registration rejected", HttpStatus.OK),
    SELLER_ROLE_REVOKED(1603, "Seller role revoked", HttpStatus.OK),
    USER_UPGRADED_TO_SELLER(1604, "User upgraded to seller role", HttpStatus.OK),

    // Notification (17xx)
    NOTIFICATION_READ(1700, "Notification marked as read", HttpStatus.OK),
    ALL_NOTIFICATIONS_READ(1701, "All notifications marked as read", HttpStatus.OK),
    NOTIFICATION_DELETED(1702, "Notification deleted", HttpStatus.OK),
    ALL_NOTIFICATIONS_DELETED(1703, "All notifications deleted", HttpStatus.OK),

    // Contact (18xx)
    CONTACT_SUBMITTED(1800, "Contact inquiry submitted successfully", HttpStatus.CREATED),
    CONTACT_PROCESSED(1801, "Contact inquiry marked as processed", HttpStatus.OK),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}

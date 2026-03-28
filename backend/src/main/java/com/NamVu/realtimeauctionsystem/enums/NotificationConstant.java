package com.namvu.realtimeauctionsystem.enums;

import lombok.Getter;

public class NotificationConstant {

    @Getter
    public enum NotificationType {
        // Bidder
        OUTBID("Bạn đã bị vượt giá"),
        AUCTION_START("Phiên đấu giá đã bắt đầu"),
        AUCTION_ENDING_SOON("Phiên đấu giá sắp kết thúc"),
        AUCTION_ENDED_WINNER("Chúc mừng! Bạn đã thắng đấu giá"),
        AUCTION_ENDED_LOSER("Phiên đấu giá đã kết thúc"),
        AUCTION_CANCELLED("Phiên đấu giá đã bị hủy"),

        // Seller
        BID_PLACED("Có lượt đấu giá mới"),
        AUCTION_ENDED_SELLER("Phiên đấu giá của bạn đã kết thúc"),
        AUCTION_ENDED_NO_BIDS("Phiên đấu giá kết thúc không có lượt đặt giá"),
        AUCTION_APPROVED("Phiên đấu giá đã được phê duyệt"),
        AUCTION_REJECTED("Phiên đấu giá bị từ chối"),

        // Account
        SELLER_REGISTRATION_APPROVED("Đăng ký tài khoản người bán đã được chấp thuận"),
        SELLER_REGISTRATION_REJECTED("Đăng ký tài khoản người bán bị từ chối"),
        ACCOUNT_LOCKED("Tài khoản của bạn đã bị khóa"),
        ACCOUNT_SECURITY_ALERT("Cảnh báo bảo mật tài khoản"),

        // System
        FRAUD_DETECTION_ALERT("Cảnh báo gian lận"),
        SYSTEM_ANNOUNCEMENT("Thông báo hệ thống");

        private final String title;

        NotificationType(String title) {
            this.title = title;
        }
    }
}

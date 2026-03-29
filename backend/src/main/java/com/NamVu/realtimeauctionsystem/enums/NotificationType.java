package com.namvu.realtimeauctionsystem.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.MissingFormatArgumentException;

import static com.namvu.realtimeauctionsystem.enums.RedirectUrlsConstant.*;

@Getter
@RequiredArgsConstructor
@Slf4j
public enum NotificationType {

    // ==================== BIDDER ====================

    OUTBID(
            "Bạn đã bị vượt giá",
            "Sản phẩm '%s' vừa bị vượt giá. Giá cao nhất hiện tại: $%s. Đặt lại ngay để không bỏ lỡ!",
            AUCTION_DETAIL_URL
    ),
    AUCTION_START(
            "Phiên đấu giá đã bắt đầu",
            "Phiên đấu giá '%s' bạn quan tâm vừa chính thức bắt đầu. Giá khởi điểm: $%s.",
            AUCTION_DETAIL_URL
    ),
    AUCTION_ENDING_SOON(
            "Phiên đấu giá sắp kết thúc",
            "Phiên đấu giá '%s' sẽ kết thúc sau %s phút. Giá hiện tại: $%s. Đừng để vuột mất!",
            AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_WINNER(
            "Chúc mừng! Bạn đã thắng đấu giá",
            "Bạn đã thắng phiên đấu giá '%s' với mức giá $%s.",
            AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_LOSER(
            "Phiên đấu giá đã kết thúc",
            "Phiên đấu giá '%s' đã kết thúc. Rất tiếc, bạn không phải người chiến thắng lần này.",
            AUCTION_DETAIL_URL
    ),
    AUCTION_CANCELLED(
            "Phiên đấu giá đã bị hủy",
            "Phiên đấu giá '%s' đã bị hủy bởi người tổ chức. Tiền đặt cọc (nếu có) sẽ được hoàn trả.",
            AUCTION_DETAIL_URL
    ),

    // ==================== SELLER ====================

    BID_PLACED(
            "Có lượt đấu giá mới",
            "Sản phẩm '%s' vừa có lượt đặt giá mới: $%s từ người dùng %s.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_SELLER(
            "Phiên đấu giá của bạn đã kết thúc",
            "Phiên đấu giá '%s' đã kết thúc. Giá thắng cuộc: $%s — người thắng: %s.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_NO_BIDS(
            "Phiên đấu giá kết thúc không có lượt đặt giá",
            "Phiên đấu giá '%s' đã kết thúc mà không có lượt đặt giá nào.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_APPROVED(
            "Phiên đấu giá đã được phê duyệt",
            "Phiên đấu giá '%s' của bạn đã được kiểm duyệt và sẽ bắt đầu vào lúc %s.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_REJECTED(
            "Phiên đấu giá bị từ chối",
            "Phiên đấu giá '%s' của bạn bị từ chối kiểm duyệt. Lý do: %s.",
            SELLER_AUCTION_DETAIL_URL
    ),

    // ==================== ACCOUNT ====================

    SELLER_REGISTRATION_APPROVED(
            "Đăng ký tài khoản người bán đã được chấp thuận",
            "Chúc mừng! Tài khoản người bán của bạn đã được phê duyệt. Bạn có thể bắt đầu đăng phiên đấu giá ngay bây giờ.",
            SELLER_DASHBOARD_URL
    ),
    SELLER_REGISTRATION_REJECTED(
            "Đăng ký tài khoản người bán bị từ chối",
            "Yêu cầu đăng ký người bán của bạn bị từ chối. Lý do: %s.",
            SELLER_REGISTRATION_URL
    ),
    ACCOUNT_LOCKED(
            "Tài khoản của bạn đã bị khóa",
            "Tài khoản của bạn đã bị khóa vào lúc %s. Lý do: %s. Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.",
            SUPPORT_CONTACT_URL
    ),
    ACCOUNT_SECURITY_ALERT(
            "Cảnh báo bảo mật tài khoản",
            "Chúng tôi phát hiện đăng nhập bất thường vào tài khoản của bạn lúc %s từ thiết bị %s. Nếu không phải bạn, hãy đổi mật khẩu ngay.",
            ACCOUNT_SECURITY_URL
    ),

    // ==================== SYSTEM ====================

    FRAUD_DETECTION_ALERT(
            "Cảnh báo gian lận",
            "Hệ thống phát hiện hoạt động đáng ngờ liên quan đến tài khoản của bạn vào lúc %s.",
            ACCOUNT_VERIFY_URL
    ),
    SYSTEM_ANNOUNCEMENT(
            "Thông báo hệ thống",
            "%s",
            "%s"
    );

    private final String title;
    private final String content;
    private final String redirectUrl;

    public String buildContent(Object... args) {
        try {
            return String.format(this.content, args);
        } catch (MissingFormatArgumentException e) {
            log.error("[Notification] {} - thiếu args cho content. Expected: '{}', Got: {} args",
                    this.name(), this.content, args.length);
            return this.title; // fallback an toàn
        }
    }

    public String buildRedirectUrl(Object... args) {
        try {
            return String.format(this.redirectUrl, args);
        } catch (MissingFormatArgumentException e) {
            log.error("[Notification] {} - thiếu args cho redirectUrl. Expected: '{}', Got: {} args",
                    this.name(), this.redirectUrl, args.length);
            return "/"; // fallback về trang chủ
        }
    }
}

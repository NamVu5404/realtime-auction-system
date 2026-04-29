package com.namvu.realtimeauctionsystem.common.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.MissingFormatArgumentException;

import static com.namvu.realtimeauctionsystem.common.constant.NotificationConstant.RedirectUrlsConstant.*;

@Getter
@RequiredArgsConstructor
@Slf4j
public enum NotificationConstant {

    // ==================== BIDDER ====================

    OUTBID(
            "Bạn đã bị vượt giá",
            "Sản phẩm '%s' vừa bị vượt giá. Giá cao nhất hiện tại: %s. Đặt lại ngay để không bỏ lỡ!",
            AUCTION_DETAIL_URL
    ),
    AUCTION_START(
            "Phiên đấu giá đã bắt đầu",
            "Phiên đấu giá '%s' bạn quan tâm vừa chính thức bắt đầu. Giá khởi điểm: %s.",
            AUCTION_DETAIL_URL
    ),
    AUCTION_ENDING_SOON(
            "Phiên đấu giá sắp kết thúc",
            "Phiên đấu giá '%s' sắp kết thúc. Giá hiện tại: %s. Đừng để vuột mất!",
            AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_WINNER(
            "Chúc mừng! Bạn đã thắng đấu giá",
            "Bạn đã thắng phiên đấu giá '%s' với mức giá %s.",
            AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_LOSER(
            "Phiên đấu giá đã kết thúc",
            "Phiên đấu giá '%s' đã kết thúc. Rất tiếc, bạn không phải người chiến thắng lần này.",
            AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_NO_SALE_BIDDER(
            "Phiên đấu giá đã kết thúc!",
            "Phiên đấu giá '%s' đã kết thúc do không đạt giá dự trữ. Rất tiếc, không có người chiến thắng lần này.",
            AUCTION_DETAIL_URL
    ),
    AUCTION_CANCELLED(
            "Phiên đấu giá đã bị hủy",
            "Phiên đấu giá '%s' đã bị hủy bởi người tổ chức. Tiền đặt cọc (nếu có) sẽ được hoàn trả.",
            HOME_URL
    ),

    // ==================== SELLER ====================

    BID_PLACED(
            "Có lượt đấu giá mới",
            "Sản phẩm '%s' vừa có lượt đặt giá mới: %s.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_SELLER(
            "Phiên đấu giá của bạn đã kết thúc",
            "Phiên đấu giá '%s' đã kết thúc. Giá thắng cuộc: %s - người thắng: %s.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_NO_BIDS(
            "Phiên đấu giá kết thúc không có lượt đặt giá",
            "Phiên đấu giá '%s' đã kết thúc mà không có lượt đặt giá nào.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_ENDED_NO_SALE_SELLER(
            "Phiên đấu giá đã kết thúc",
            "Phiên đấu giá '%s' đã kết thúc nhưng không đạt giá dự trữ. Bạn có thể đăng lại phiên này.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_PENDING_REVIEW(
            "Phiên đấu giá đang chờ kiểm duyệt",
            "Phiên đấu giá '%s' của bạn đang được kiểm duyệt. Kết quả sẽ được thông báo sớm.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_APPROVED(
            "Phiên đấu giá đã được phê duyệt",
            "Phiên đấu giá '%s' của bạn đã được kiểm duyệt.",
            SELLER_AUCTION_DETAIL_URL
    ),
    AUCTION_REJECTED(
            "Phiên đấu giá bị từ chối",
            "Phiên đấu giá '%s' của bạn bị từ chối kiểm duyệt. Lý do: %s.",
            SELLER_AUCTION_DETAIL_URL
    ),

    // ==================== ADMIN ====================

    REQUEST_REVIEW_AUCTION(
            "Phiên đấu giá cần kiểm duyệt",
            "Có phiên đấu giá '%s' đang chờ kiểm duyệt thủ công.",
            ADMIN_AUCTION_REVIEW_URL
    ),

    // ==================== ACCOUNT ====================

    REQUEST_APPLY_SELLER(
            "Yêu cầu đăng ký người bán",
            "Bạn có một yêu cầu đăng ký người bán mới. Vui lòng xem xét và phê duyệt.",
            ADMIN_SELLER_MANAGEMENT_URL
    ),
    SELLER_REGISTRATION_APPROVED(
            "Đăng ký tài khoản người bán đã được chấp thuận",
            "Chúc mừng! Bạn đã trở thành người bán. Hãy đăng nhập lại để có hiệu lực",
            SELLER_DASHBOARD_URL
    ),
    MANUAL_UPGRADE_TO_SELLER(
            "Tài khoản đã được nâng cấp",
            "Chúc mừng! Quản trị viên đã nâng cấp tài khoản của bạn lên quyền Người bán. Hãy đăng nhập lại để bắt đầu.",
            SELLER_DASHBOARD_URL
    ),
    SELLER_REGISTRATION_REJECTED(
            "Đăng ký tài khoản người bán bị từ chối",
            "Yêu cầu đăng ký người bán của bạn bị từ chối. Lý do: %s.",
            SELLER_REGISTRATION_URL
    ),
    REVOKE_SELLER_ROLE(
            "Thu hồi quyền người bán",
            "Quyền người bán của bạn đã bị thu hồi. Lý do: %s. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.",
            SELLER_REGISTRATION_URL
    ),
    ACCOUNT_SECURITY_ALERT( // Pending + mail
            "Cảnh báo bảo mật tài khoản",
            "Chúng tôi phát hiện đăng nhập bất thường vào tài khoản của bạn lúc %s từ thiết bị %s. Nếu không phải bạn, hãy đổi mật khẩu ngay.",
            ACCOUNT_SECURITY_URL
    ),

    // ==================== SYSTEM ====================

    FRAUD_DETECTION_ALERT( // Pending + mail
            "Cảnh báo gian lận",
            "Hệ thống phát hiện hoạt động đáng ngờ liên quan đến tài khoản của bạn vào lúc %s.",
            ACCOUNT_VERIFY_URL
    ),
    SYSTEM_ANNOUNCEMENT( // Pending + mail
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

    public static final class RedirectUrlsConstant {
        private RedirectUrlsConstant() {
            /* This utility class should not be instantiated */
        }

        public static final String HOME_URL = "/";
        public static final String AUCTION_DETAIL_URL = "/auction/%d";
        public static final String SELLER_AUCTION_DETAIL_URL = "/seller/auctions/%d";
        public static final String SELLER_DASHBOARD_URL = "/seller";
        public static final String SELLER_REGISTRATION_URL = "/account/seller-reg";
        public static final String ACCOUNT_SECURITY_URL = "/account/security-logs";
        public static final String ACCOUNT_VERIFY_URL = "/account/verify";
        public static final String ADMIN_SELLER_MANAGEMENT_URL = "/admin/sellers?tab=requests";
        public static final String ADMIN_AUCTION_REVIEW_URL = "/admin/auction-review";
    }
}

package com.namvu.realtimeauctionsystem.utils;

public class NotificationConstants {
    // Bidder Notifications
    public static final String OUTBID_CONTENT = "Người dùng '%s' vừa trả mức giá %s cho kiện hàng bạn đang theo dõi. Trả giá cao hơn ngay!";
    public static final String AUCTION_START_CONTENT = "Phiên đấu giá '%s' đã bắt đầu!";
    public static final String AUCTION_ENDING_SOON_CONTENT = "Phiên đấu giá '%s' sắp kết thúc!";
    public static final String AUCTION_ENDED_WINNER_CONTENT = "Chúc mừng! Bạn đã thắng đấu giá '%s' với mức giá %s";
    public static final String AUCTION_ENDED_LOSER_CONTENT = "Phiên đấu giá '%s' đã kết thúc. Rất tiếc bạn không phải là người chiến thắng.";
    public static final String AUCTION_CANCELLED_CONTENT = "Phiên đấu giá '%s' đã bị hủy vì lý do: %s";

    // Seller Notifications
    public static final String BID_PLACED_CONTENT = "Sản phẩm '%s' của bạn vừa nhận được mức giá mới: %s từ '%s'";
    public static final String AUCTION_ENDED_SELLER_CONTENT = "Phiên đấu giá '%s' của bạn đã kết thúc. Giá cuối cùng: %s";
    public static final String AUCTION_ENDED_NO_BIDS_CONTENT = "Phiên đấu giá '%s' kết thúc không có lượt đặt giá.";
    public static final String AUCTION_APPROVED_CONTENT = "Phiên đấu giá '%s' đã được phê duyệt và sắp bắt đầu.";
    public static final String AUCTION_REJECTED_CONTENT = "Phiên đấu giá '%s' của bạn bị từ chối. Lý do: %s";

    // Common Redirect URLs
    public static final String AUCTION_DETAIL_URL = "/auction/%d";
    public static final String SELLER_AUCTION_DETAIL_URL = "/seller/auctions/%d";
}

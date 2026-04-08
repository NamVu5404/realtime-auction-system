package com.namvu.realtimeauctionsystem.common.constant;

public final class CacheNameConstant {
    private CacheNameConstant() {
        /* This utility class should not be instantiated */
    }

    public static final String BLACKLISTED_TOKEN_PREFIX = "blacklist:jti:";

    public static final String AUCTIONS = "auctions";
    public static final String NOTIFICATION_COUNT = "notificationCount";
    public static final String NOTIFICATION_BELL = "notificationBell";
    public static final String AUCTION_IMAGES = "auctionImages";

    public static final class AuctionCacheKeyConstant {
        private AuctionCacheKeyConstant() {
            /* This utility class should not be instantiated */
        }

        public static final String TITLE = "title";
        public static final String CURRENT_PRICE = "currentPrice";
        public static final String MIN_STEP = "minStep";
        public static final String HIGHEST_BIDDER_ID = "highestBidderId";
        public static final String SELLER_ID = "sellerId";
        public static final String BID_COUNT = "bidCount";
        public static final String LAST_BID_TIME = "lastBidTime";
        public static final String END_TIME = "endTime";
        public static final String STATUS = "status";
        public static final String ANTI_SNIPE_SECONDS = "antiSnipeSeconds";
        public static final String EXTENSION_SECONDS = "extensionSeconds";
        public static final String EXTENSION_COUNT = "extensionCount";
        public static final String VERSION = "version";
    }
}

package com.namvu.realtimeauctionsystem.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuctionCacheKey {
    TITLE("title"),
    CURRENT_PRICE("currentPrice"),
    MIN_STEP("minStep"),
    HIGHEST_BIDDER_ID("highestBidderId"),
    SELLER_ID("sellerId"),
    BID_COUNT("bidCount"),
    LAST_BID_TIME("lastBidTime"),
    END_TIME("endTime"),
    STATUS("status"),
    ANTI_SNIPE_SECONDS("antiSnipeSeconds"),
    EXTENSION_SECONDS("extensionSeconds"),
    EXTENSION_COUNT("extensionCount"),
    VERSION("version");

    private final String value;
}

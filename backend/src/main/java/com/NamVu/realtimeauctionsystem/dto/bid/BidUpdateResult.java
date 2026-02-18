package com.NamVu.realtimeauctionsystem.dto.bid;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidUpdateResult {
    private boolean success;
    private String message;
    private BigDecimal newPrice;
    private Long highestBidderId;
    private Instant timestamp;
    private boolean extended;
    private Long version; // Version của Auction entity sau khi update

    public static BidUpdateResult success(BigDecimal price, Long bidderId, Instant timestamp, boolean extended) {
        return BidUpdateResult.builder()
                .success(true)
                .message("Bid placed successfully")
                .newPrice(price)
                .highestBidderId(bidderId)
                .timestamp(timestamp)
                .extended(extended)
                .build();
    }

    public static BidUpdateResult failure(String message, Instant timestamp) {
        return BidUpdateResult.builder()
                .success(false)
                .message(message)
                .timestamp(timestamp)
                .build();
    }
}

package com.NamVu.realtimeauctionsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidUpdateResult {
    private boolean success;
    private String message;
    private BigDecimal newPrice;
    private Long highestBidderId;
    private Long version; // Version của Auction entity sau khi update

    public static BidUpdateResult success(BigDecimal price, Long bidderId, Long version) {
        return BidUpdateResult.builder()
                .success(true)
                .message("Bid placed successfully")
                .newPrice(price)
                .highestBidderId(bidderId)
                .version(version)
                .build();
    }

    public static BidUpdateResult failure(String message) {
        return BidUpdateResult.builder()
                .success(false)
                .message(message)
                .build();
    }
}

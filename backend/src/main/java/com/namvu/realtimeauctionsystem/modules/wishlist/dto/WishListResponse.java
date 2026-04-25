package com.namvu.realtimeauctionsystem.modules.wishlist.dto;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
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
public class WishListResponse {
    private Long id;
    private Long auctionId;
    private String title;
    private String image;
    private BigDecimal startPrice;
    private BigDecimal currentPrice;
    private AuctionStatus status;
    private Instant startTime;
    private Instant endTime;
    private String sellerName;
    private boolean privateMode;
    private Instant createdAt;
}

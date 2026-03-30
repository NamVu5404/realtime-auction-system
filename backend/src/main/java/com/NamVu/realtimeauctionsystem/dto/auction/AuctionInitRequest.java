package com.namvu.realtimeauctionsystem.dto.auction;

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
public class AuctionInitRequest {
    private Long auctionId;
    private String title;
    private BigDecimal startPrice;
    private BigDecimal minStep;
    private Long sellerId;
    private Instant endTime;
    private Integer antiSnipeSeconds;
    private Integer extensionSeconds;
    private Integer extensionCount;
}

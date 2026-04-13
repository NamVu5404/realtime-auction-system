package com.namvu.realtimeauctionsystem.modules.bid.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MostActiveAuctionData {
    private Long auctionId;
    private String title;
    private Long bidCount;
    private BigDecimal currentPrice;
    private String status;
}

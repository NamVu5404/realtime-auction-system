package com.namvu.realtimeauctionsystem.modules.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopSellerData {
    private Long sellerId;
    private String name;
    private String email;
    private String avatarUrl;
    private BigDecimal totalRevenue;
    private Long auctionCount;
}

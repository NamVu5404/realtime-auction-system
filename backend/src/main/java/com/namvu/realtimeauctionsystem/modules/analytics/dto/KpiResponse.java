package com.namvu.realtimeauctionsystem.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiResponse {
    private BigDecimal totalPlatformRevenue;
    private Long liveAuctions;
    private Long totalUsers;
    private Long totalSellers;
    private Long pendingSellerRequests;
    private Long pendingContacts;
}

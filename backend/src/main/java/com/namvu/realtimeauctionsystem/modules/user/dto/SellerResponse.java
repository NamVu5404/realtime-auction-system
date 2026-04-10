package com.namvu.realtimeauctionsystem.modules.user.dto;

import java.time.Instant;

public interface SellerResponse {
    Long getUserId();
    String getName();
    String getEmail();
    String getPhone();
    String getAvatarUrl();
    String getLocation();

    Long getTotalAuctions();
    Long getLiveAuctions();
    Long getEndedAuctions();
    Long getTotalRevenue();

    Instant getApprovedAt();
}

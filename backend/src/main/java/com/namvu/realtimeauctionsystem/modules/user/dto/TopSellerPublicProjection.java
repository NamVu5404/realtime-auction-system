package com.namvu.realtimeauctionsystem.modules.user.dto;

public interface TopSellerPublicProjection {
    Long getSellerId();
    String getName();
    String getAvatarUrl();
    String getLocation();
    Boolean getIsVerifiedIdentity();
    Long getTotalAuctions();
    Long getLiveAuctions();
    Long getSoldAuctions();
}

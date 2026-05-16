package com.namvu.realtimeauctionsystem.modules.user.dto;

public interface TopBidderPublicProjection {
    Long getId();
    String getName();
    String getAvatarUrl();
    String getLocation();
    Long getTotalBids();
    Long getTotalAuctionsParticipated();
    Long getTotalWins();
}

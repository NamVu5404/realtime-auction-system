package com.namvu.realtimeauctionsystem.modules.bid.dto;

public interface BidChartProjection {
    String getPeriodLabel();

    Long getBidCount();

    Long getAuctionsParticipated();
}

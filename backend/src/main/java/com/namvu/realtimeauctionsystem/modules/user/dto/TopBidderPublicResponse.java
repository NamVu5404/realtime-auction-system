package com.namvu.realtimeauctionsystem.modules.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopBidderPublicResponse {
    private Long id;
    private String name;
    private String avatarUrl;
    private String location;
    private Long totalBids;
    private Long totalAuctionsParticipated;
    private Long totalWins;
}

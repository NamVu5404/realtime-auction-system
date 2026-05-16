package com.namvu.realtimeauctionsystem.modules.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopSellerPublicResponse {
    private Long id;
    private String name;
    private String avatarUrl;
    private String location;

    @JsonProperty("isVerifiedIdentity")
    private boolean isVerifiedIdentity;

    private Long totalAuctions;
    private Long liveAuctions;
    private Long soldAuctions;
}

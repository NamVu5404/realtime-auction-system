package com.namvu.realtimeauctionsystem.dto.auction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelAuctionResponse {
    private Long auctionId;
    private String reason;
    private Instant timestamp;
    private String by;
}

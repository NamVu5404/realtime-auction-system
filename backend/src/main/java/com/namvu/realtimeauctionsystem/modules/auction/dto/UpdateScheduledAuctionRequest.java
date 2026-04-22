package com.namvu.realtimeauctionsystem.modules.auction.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateScheduledAuctionRequest {

    private String description;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private Instant startTime;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private Instant endTime;

    @Min(value = 0, message = "Anti-snipe seconds must be non-negative")
    @Max(value = 60, message = "Anti-snipe seconds must be at most 60")
    private Integer antiSnipeSeconds;

    @Min(value = 0, message = "Extension seconds must be non-negative")
    @Max(value = 300, message = "Extension seconds must be at most 300")
    private Integer extensionSeconds;

    private BigDecimal reservePrice;
    private boolean privateMode;
}

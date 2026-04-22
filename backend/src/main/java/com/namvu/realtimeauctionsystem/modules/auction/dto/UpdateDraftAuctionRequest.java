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
public class UpdateDraftAuctionRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @DecimalMin(value = "0.01", message = "Start price must be at least 0.01")
    private BigDecimal startPrice;

    @DecimalMin(value = "0.01", message = "Minimum step must be at least 0.01")
    private BigDecimal minStep;

    @Future(message = "Start time must be in the future")
    private Instant startTime;

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

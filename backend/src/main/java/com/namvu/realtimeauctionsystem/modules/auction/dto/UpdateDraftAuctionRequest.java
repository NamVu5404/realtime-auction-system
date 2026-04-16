package com.namvu.realtimeauctionsystem.modules.auction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
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
}

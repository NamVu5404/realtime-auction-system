package com.namvu.realtimeauctionsystem.dto.auction;

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

    @NotBlank(message = "INVALID_INPUT")
    private String title;

    private String description;

    @DecimalMin(value = "0.01", message = "INVALID_INPUT")
    private BigDecimal startPrice;

    @DecimalMin(value = "0.01", message = "INVALID_INPUT")
    private BigDecimal minStep;

    @Future(message = "INVALID_INPUT")
    private Instant startTime;

    @Future(message = "INVALID_INPUT")
    private Instant endTime;
}

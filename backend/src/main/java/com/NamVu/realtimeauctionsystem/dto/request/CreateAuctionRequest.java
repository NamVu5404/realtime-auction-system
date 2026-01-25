package com.NamVu.realtimeauctionsystem.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuctionRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String image;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal startPrice;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal minStep;

    @NotNull
    private Long sellerId;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private Instant startTime;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private Instant endTime;

    private Integer antiSnipeSeconds = 60;
    private Integer extensionSeconds = 30;

    @AssertTrue(message = "End time must be after start time")
    private boolean isEndTimeValid() {
        return endTime.isAfter(startTime);
    }
}

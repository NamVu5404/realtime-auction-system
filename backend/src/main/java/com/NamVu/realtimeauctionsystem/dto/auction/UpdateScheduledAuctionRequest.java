package com.namvu.realtimeauctionsystem.dto.auction;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateScheduledAuctionRequest {

    @NotBlank(message = "INVALID_INPUT")
    private String title;

    private String description;

    private String image;

    @NotNull(message = "INVALID_INPUT")
    @Future(message = "INVALID_INPUT")
    private Instant startTime;

    @NotNull(message = "INVALID_INPUT")
    @Future(message = "INVALID_INPUT")
    private Instant endTime;
}

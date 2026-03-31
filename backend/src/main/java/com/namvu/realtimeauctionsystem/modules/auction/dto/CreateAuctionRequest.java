package com.namvu.realtimeauctionsystem.modules.auction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuctionRequest {

    private Long id;

    @NotBlank(groups = {Draft.class, Scheduler.class}, message = "Title is required")
    private String title;

    private String description;

    @NotNull(groups = Scheduler.class, message = "Initial price is required")
    @DecimalMin(value = "0.01", groups = Scheduler.class, message = "Initial price must be at least 0.01")
    private BigDecimal startPrice;

    @NotNull(groups = Scheduler.class, message = "Minimum price step is required")
    @DecimalMin(value = "0.01", groups = Scheduler.class, message = "Minimum price step must be at least 0.01")
    private BigDecimal minStep;

    @NotNull(groups = Scheduler.class, message = "Auction start time is required")
    @Future(groups = Scheduler.class, message = "Auction start time must be in the future")
    private Instant startTime;

    @NotNull(groups = Scheduler.class, message = "Auction end time is required")
    @Future(groups = Scheduler.class, message = "Auction end time must be in the future")
    private Instant endTime;

    public interface Draft {}
    public interface Scheduler {}
}

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

    @Min(value = 0, groups = {Draft.class, Scheduler.class}, message = "Anti-snipe seconds must be non-negative")
    @Max(value = 60, groups = {Draft.class, Scheduler.class}, message = "Anti-snipe seconds must be at most 60")
    private Integer antiSnipeSeconds;

    @Min(value = 0, groups = {Draft.class, Scheduler.class}, message = "Extension seconds must be non-negative")
    @Max(value = 300, groups = {Draft.class, Scheduler.class}, message = "Extension seconds must be at most 300")
    private Integer extensionSeconds;

    private BigDecimal reservePrice;
    private boolean privateMode;

    public interface Draft {}
    public interface Scheduler {}
}

package com.NamVu.realtimeauctionsystem.dto.request;

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

    @NotBlank(groups = {Draft.class, Scheduler.class}, message = "INVALID_INPUT")
    private String title;

    private String description;

    private String image;

    @NotNull(groups = Scheduler.class, message = "INVALID_INPUT")
    @DecimalMin(value = "0.01", groups = Scheduler.class, message = "INVALID_INPUT")
    private BigDecimal startPrice;

    @NotNull(groups = Scheduler.class, message = "INVALID_INPUT")
    @DecimalMin(value = "0.01", groups = Scheduler.class, message = "INVALID_INPUT")
    private BigDecimal minStep;

    @NotNull(groups = Scheduler.class, message = "INVALID_INPUT")
    @Future(groups = Scheduler.class, message = "INVALID_INPUT")
    private Instant startTime;

    @NotNull(groups = Scheduler.class, message = "INVALID_INPUT")
    @Future(groups = Scheduler.class, message = "INVALID_INPUT")
    private Instant endTime;

    public interface Draft {}
    public interface Scheduler {}
}

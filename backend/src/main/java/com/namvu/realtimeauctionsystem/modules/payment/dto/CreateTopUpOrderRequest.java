package com.namvu.realtimeauctionsystem.modules.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTopUpOrderRequest {
    @NotNull
    @Min(10000)
    private Long amount;
}

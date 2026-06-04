package com.namvu.realtimeauctionsystem.modules.payment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTopUpOrderRequest {
    @NotNull
    @Min(value = 10000, message = "Minimum top-up amount is 10,000 VND")
    @Max(value = 500_000_000, message = "Maximum top-up amount is 500,000,000 VND")
    private Long amount;
}

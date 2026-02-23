package com.NamVu.realtimeauctionsystem.dto.bid;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaceBidRequestV2 {
    @NotNull(message = "AMOUNT_NOT_BLANK")
    @DecimalMin(value = "0.01", message = "INVALID_AMOUNT")
    private BigDecimal amount;
}

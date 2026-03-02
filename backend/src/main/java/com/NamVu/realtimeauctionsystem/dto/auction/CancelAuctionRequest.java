package com.namvu.realtimeauctionsystem.dto.auction;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelAuctionRequest {

    @NotBlank(message = "REASON_NOT_BLANK")
    private String reason;
}

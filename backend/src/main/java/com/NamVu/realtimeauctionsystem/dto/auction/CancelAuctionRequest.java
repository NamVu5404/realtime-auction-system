package com.NamVu.realtimeauctionsystem.dto.auction;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelAuctionRequest {

    @NotBlank
    private String reason;
}

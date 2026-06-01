package com.namvu.realtimeauctionsystem.modules.wallet.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class WalletResponse {
    private Long userId;
    private BigDecimal availableBalance;
    private BigDecimal lockedBalance;
    private BigDecimal totalBalance;
    private Instant updatedAt;
}

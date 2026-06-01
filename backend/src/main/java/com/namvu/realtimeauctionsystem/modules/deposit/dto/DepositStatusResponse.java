package com.namvu.realtimeauctionsystem.modules.deposit.dto;

import com.namvu.realtimeauctionsystem.common.constant.DepositStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class DepositStatusResponse {
    private boolean hasDeposit;
    private Long auctionId;
    private BigDecimal depositAmount;
    private DepositStatus status;
    private Instant createdAt;
    private Instant releasedAt;
}

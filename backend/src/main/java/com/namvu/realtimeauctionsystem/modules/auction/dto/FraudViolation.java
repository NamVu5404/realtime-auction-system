package com.namvu.realtimeauctionsystem.modules.auction.dto;

import com.namvu.realtimeauctionsystem.common.constant.FraudType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FraudViolation {
    private FraudType type;
    private int score;
}

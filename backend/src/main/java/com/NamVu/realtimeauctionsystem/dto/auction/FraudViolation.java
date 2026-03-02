package com.namvu.realtimeauctionsystem.dto.auction;

import com.namvu.realtimeauctionsystem.enums.FraudType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FraudViolation {
    private FraudType type;
    private int score;
}

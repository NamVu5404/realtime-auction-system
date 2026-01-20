package com.NamVu.realtimeauctionsystem.dto;

import com.NamVu.realtimeauctionsystem.enums.FraudType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
class FraudViolation {
    private FraudType type;
    private int score;
}

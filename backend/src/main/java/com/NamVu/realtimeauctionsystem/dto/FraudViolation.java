package com.NamVu.realtimeauctionsystem.dto;

import com.NamVu.realtimeauctionsystem.enums.FraudType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FraudViolation {
    private FraudType type;
    private int score;
}

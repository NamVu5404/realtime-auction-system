package com.namvu.realtimeauctionsystem.modules.fraud.dto;

import com.namvu.realtimeauctionsystem.common.constant.FraudType;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class FraudCheckResult {
    private int riskScore = 0;
    private List<FraudViolation> violations = new ArrayList<>();

    public void addViolation(FraudType type, int score) {
        violations.add(new FraudViolation(type, score));
        riskScore += score;
    }

    public boolean isHighRisk() {
        return riskScore >= 100; // Self-bidding, rate limit quá cao
    }

    public boolean isMediumRisk() {
        return riskScore >= 50 && riskScore < 100; // Price spike, bot
    }

    public FraudType getPrimaryViolation() {
        return violations.isEmpty() ? null : violations.getFirst().getType();
    }

    public String getReason() {
        return violations.stream()
                .map(v -> v.getType().name() + " (score: " + v.getScore() + ")")
                .collect(Collectors.joining(", "));
    }
}

package com.namvu.realtimeauctionsystem.modules.ai.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AiLogCountResponse {
    long total;
    long approved;
    long rejected;
    long fallbackToAdmin;
}

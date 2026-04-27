package com.namvu.realtimeauctionsystem.modules.ai.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiReviewResponse {
    private String decision;
    private float confidence;
    private String reasons;
}

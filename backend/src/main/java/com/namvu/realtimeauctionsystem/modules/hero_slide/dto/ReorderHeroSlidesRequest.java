package com.namvu.realtimeauctionsystem.modules.hero_slide.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ReorderHeroSlidesRequest {
    @NotEmpty(message = "Ordered IDs must not be empty")
    private List<Long> orderedIds;
}

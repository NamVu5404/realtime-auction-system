package com.namvu.realtimeauctionsystem.modules.hero_slide.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddHeroSlideRequest {
    @NotNull(message = "Auction ID is required")
    private Long auctionId;
}

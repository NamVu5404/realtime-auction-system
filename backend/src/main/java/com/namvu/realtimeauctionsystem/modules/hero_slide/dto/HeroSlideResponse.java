package com.namvu.realtimeauctionsystem.modules.hero_slide.dto;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeroSlideResponse {
    private Long id;
    private Long auctionId;
    private String auctionTitle;
    private String auctionImage;
    private AuctionStatus auctionStatus;
    private int position;
    private boolean active;
}

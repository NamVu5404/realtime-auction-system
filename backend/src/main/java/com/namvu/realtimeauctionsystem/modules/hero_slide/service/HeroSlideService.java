package com.namvu.realtimeauctionsystem.modules.hero_slide.service;

import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionResponse;
import com.namvu.realtimeauctionsystem.modules.hero_slide.dto.HeroSlideResponse;

import java.util.List;

public interface HeroSlideService {

    List<AuctionResponse> getPublicHeroSlides();

    List<HeroSlideResponse> getAdminHeroSlides();

    HeroSlideResponse addHeroSlide(Long auctionId);

    void removeHeroSlide(Long id);

    List<HeroSlideResponse> reorderHeroSlides(List<Long> orderedIds);

    HeroSlideResponse toggleActive(Long id);
}

package com.namvu.realtimeauctionsystem.modules.hero_slide.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionResponse;
import com.namvu.realtimeauctionsystem.modules.hero_slide.dto.AddHeroSlideRequest;
import com.namvu.realtimeauctionsystem.modules.hero_slide.dto.HeroSlideResponse;
import com.namvu.realtimeauctionsystem.modules.hero_slide.dto.ReorderHeroSlidesRequest;
import com.namvu.realtimeauctionsystem.modules.hero_slide.service.HeroSlideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequiredArgsConstructor
public class HeroSlideController {

    private final HeroSlideService heroSlideService;

    @GetMapping("/v1/hero-slides")
    public ApiResponse<List<AuctionResponse>> getPublicHeroSlides() {
        return ApiResponse.ok(heroSlideService.getPublicHeroSlides());
    }

    @GetMapping("/v1/admin/hero-slides")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<HeroSlideResponse>> getAdminHeroSlides() {
        return ApiResponse.ok(heroSlideService.getAdminHeroSlides());
    }

    @PostMapping("/v1/admin/hero-slides")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<HeroSlideResponse> addHeroSlide(@Valid @RequestBody AddHeroSlideRequest request) {
        return ApiResponse.of(HERO_SLIDE_ADDED, heroSlideService.addHeroSlide(request.getAuctionId()));
    }

    @DeleteMapping("/v1/admin/hero-slides/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> removeHeroSlide(@PathVariable Long id) {
        heroSlideService.removeHeroSlide(id);
        return ApiResponse.of(HERO_SLIDE_REMOVED, null);
    }

    @PutMapping("/v1/admin/hero-slides/reorder")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<HeroSlideResponse>> reorderHeroSlides(@Valid @RequestBody ReorderHeroSlidesRequest request) {
        return ApiResponse.of(HERO_SLIDE_REORDERED, heroSlideService.reorderHeroSlides(request.getOrderedIds()));
    }

    @PatchMapping("/v1/admin/hero-slides/{id}/toggle")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<HeroSlideResponse> toggleActive(@PathVariable Long id) {
        return ApiResponse.of(HERO_SLIDE_TOGGLED, heroSlideService.toggleActive(id));
    }
}

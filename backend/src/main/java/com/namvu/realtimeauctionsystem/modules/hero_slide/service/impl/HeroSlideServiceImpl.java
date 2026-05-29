package com.namvu.realtimeauctionsystem.modules.hero_slide.service.impl;

import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionResponse;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionImageService;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.hero_slide.dto.HeroSlideResponse;
import com.namvu.realtimeauctionsystem.modules.hero_slide.entity.HeroSlide;
import com.namvu.realtimeauctionsystem.modules.hero_slide.repository.HeroSlideRepository;
import com.namvu.realtimeauctionsystem.modules.hero_slide.service.HeroSlideService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class HeroSlideServiceImpl implements HeroSlideService {

    private final HeroSlideRepository heroSlideRepository;
    private final AuctionService auctionService;
    private final AuctionImageService auctionImageService;

    @Override
    @Transactional(readOnly = true)
    public List<AuctionResponse> getPublicHeroSlides() {
        return heroSlideRepository.findByActiveTrueOrderByPositionAsc().stream()
                .map(slide -> auctionService.getAuctionDetail(slide.getAuction().getId(), null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HeroSlideResponse> getAdminHeroSlides() {
        List<HeroSlide> slides = heroSlideRepository.findAllByOrderByPositionAsc();
        List<Long> auctionIds = slides.stream()
                .map(s -> s.getAuction().getId())
                .toList();
        Map<Long, String> imageMap = buildImageMap(auctionIds);
        return slides.stream()
                .map(s -> toAdminResponse(s, imageMap))
                .toList();
    }

    @Override
    @Transactional
    public HeroSlideResponse addHeroSlide(Long auctionId) {
        if (heroSlideRepository.existsByAuctionId(auctionId)) {
            throw new AppException(ErrorCode.HERO_SLIDE_ALREADY_EXISTS);
        }
        Auction auction = auctionService.getAuctionReference(auctionId);
        int nextPosition = heroSlideRepository.findAllByOrderByPositionAsc().size();

        HeroSlide slide = HeroSlide.builder()
                .auction(auction)
                .position(nextPosition)
                .active(true)
                .build();
        slide = heroSlideRepository.save(slide);

        Map<Long, String> imageMap = buildImageMap(List.of(auctionId));
        return toAdminResponse(slide, imageMap);
    }

    @Override
    @Transactional
    public void removeHeroSlide(Long id) {
        HeroSlide slide = heroSlideRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HERO_SLIDE_NOT_FOUND));
        heroSlideRepository.delete(slide);
        reindex(heroSlideRepository.findAllByOrderByPositionAsc());
    }

    @Override
    @Transactional
    public List<HeroSlideResponse> reorderHeroSlides(List<Long> orderedIds) {
        List<HeroSlide> all = heroSlideRepository.findAllByOrderByPositionAsc();
        Map<Long, HeroSlide> byId = all.stream().collect(Collectors.toMap(HeroSlide::getId, s -> s));

        IntStream.range(0, orderedIds.size()).forEach(i -> {
            HeroSlide s = byId.get(orderedIds.get(i));
            if (s != null) s.setPosition(i);
        });
        heroSlideRepository.saveAll(all);

        List<Long> auctionIds = all.stream().map(s -> s.getAuction().getId()).toList();
        Map<Long, String> imageMap = buildImageMap(auctionIds);
        return heroSlideRepository.findAllByOrderByPositionAsc().stream()
                .map(s -> toAdminResponse(s, imageMap))
                .toList();
    }

    @Override
    @Transactional
    public HeroSlideResponse toggleActive(Long id) {
        HeroSlide slide = heroSlideRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HERO_SLIDE_NOT_FOUND));
        slide.setActive(!slide.isActive());
        heroSlideRepository.save(slide);
        Map<Long, String> imageMap = buildImageMap(List.of(slide.getAuction().getId()));
        return toAdminResponse(slide, imageMap);
    }

    private void reindex(List<HeroSlide> ordered) {
        IntStream.range(0, ordered.size()).forEach(i -> ordered.get(i).setPosition(i));
        heroSlideRepository.saveAll(ordered);
    }

    private Map<Long, String> buildImageMap(List<Long> auctionIds) {
        return auctionImageService.getPrimaryImageMap(auctionIds);
    }

    private HeroSlideResponse toAdminResponse(HeroSlide slide, Map<Long, String> imageMap) {
        Auction auction = slide.getAuction();
        return HeroSlideResponse.builder()
                .id(slide.getId())
                .auctionId(auction.getId())
                .auctionTitle(auction.getTitle())
                .auctionImage(imageMap.get(auction.getId()))
                .auctionStatus(auction.getStatus())
                .position(slide.getPosition())
                .active(slide.isActive())
                .build();
    }
}

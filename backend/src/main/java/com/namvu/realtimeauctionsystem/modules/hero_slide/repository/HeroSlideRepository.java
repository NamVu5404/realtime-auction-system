package com.namvu.realtimeauctionsystem.modules.hero_slide.repository;

import com.namvu.realtimeauctionsystem.modules.hero_slide.entity.HeroSlide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HeroSlideRepository extends JpaRepository<HeroSlide, Long> {

    List<HeroSlide> findAllByOrderByPositionAsc();

    List<HeroSlide> findByActiveTrueOrderByPositionAsc();

    boolean existsByAuctionId(Long auctionId);
}

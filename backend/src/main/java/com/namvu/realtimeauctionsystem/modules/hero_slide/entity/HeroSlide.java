package com.namvu.realtimeauctionsystem.modules.hero_slide.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "hero_slides",
        uniqueConstraints = @UniqueConstraint(name = "uk_hero_slide_auction", columnNames = {"auction_id"}),
        indexes = @Index(name = "idx_hero_slide_position", columnList = "position")
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class HeroSlide extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}

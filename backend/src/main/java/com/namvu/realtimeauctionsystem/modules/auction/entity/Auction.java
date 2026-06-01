package com.namvu.realtimeauctionsystem.modules.auction.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.file.entity.File;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "auctions",
        indexes = {
                @Index(name = "idx_auction_status_time", columnList = "status, start_time"),
                @Index(name = "idx_auction_end_time", columnList = "end_time"),
                @Index(name = "idx_auction_status_end", columnList = "status, end_time")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Auction extends Auditable {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Transient
    private List<File> images;

    @Column(precision = 15, scale = 2)
    private BigDecimal startPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal currentPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal minStep;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "highest_bidder_id")
    private User highestBidder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuctionStatus status;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(precision = 15, scale = 2)
    private BigDecimal reservePrice;

    @Column(name = "anti_snipe_seconds")
    @Builder.Default
    private Integer antiSnipeSeconds = 0;

    @Column(name = "extension_seconds")
    @Builder.Default
    private Integer extensionSeconds = 0;

    @Column(name = "extension_count")
    @Builder.Default
    private Integer extensionCount = 0;

    @Column(name = "deposit_required", nullable = false)
    private boolean depositRequired = false;

    @Column(name = "deposit_rate", precision = 5, scale = 4)
    private BigDecimal depositRate;

    @Column(name = "deposit_cutoff_minutes")
    @Builder.Default
    private Integer depositCutoffMinutes = 5;

    @Column(name = "notified_ending_soon", nullable = false)
    private boolean notifiedEndingSoon = false;

    private boolean privateMode = false;

    @Column(unique = true)
    private String token;

    @Version
    @Column(name = "version")
    private Long version;

    @PrePersist
    void prePersist() {
        currentPrice = startPrice;
    }
}

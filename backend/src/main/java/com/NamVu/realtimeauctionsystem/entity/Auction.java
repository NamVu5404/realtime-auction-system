package com.NamVu.realtimeauctionsystem.entity;

import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

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
@Builder
public class Auction extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String image;

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

    @Column(name = "anti_snipe_seconds")
    @Builder.Default
    private Integer antiSnipeSeconds = 10; // X giây

    @Column(name = "extension_seconds")
    @Builder.Default
    private Integer extensionSeconds = 30; // Y giây

    @Column(name = "extension_count")
    @Builder.Default
    private Integer extensionCount = 0;

    @Version
    @Column(name = "version")
    private Long version;

    @PrePersist
    void prePersist() {
        currentPrice = startPrice;
    }
}

package com.NamVu.realtimeauctionsystem.entity;

import com.NamVu.realtimeauctionsystem.enums.AuctionActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "auction_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionAudit extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuctionActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> details;
}

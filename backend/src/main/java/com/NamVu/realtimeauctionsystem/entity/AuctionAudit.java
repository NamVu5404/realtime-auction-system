package com.namvu.realtimeauctionsystem.entity;

import com.namvu.realtimeauctionsystem.enums.AuctionActionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "auction_audit",
        indexes = {
                @Index(name = "idx_auction_audit_auction_created_desc", columnList = "auction_id, created_at DESC")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AuctionAudit extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuctionActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> details;
}

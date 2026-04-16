package com.namvu.realtimeauctionsystem.modules.live_chat.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "live_chat", indexes = {
        @Index(name = "idx_auction_created_hidden", columnList = "auction_id, created_at, hidden")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class LiveChat extends Auditable {

    @Column(name = "auction_id", nullable = false)
    private Long auctionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Column(nullable = false, length = 200)
    private String content;

    private boolean hidden;
}

package com.namvu.realtimeauctionsystem.modules.wishlist.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "wish_list",
        uniqueConstraints = @UniqueConstraint(name = "uk_wishlist_user_auction", columnNames = {"user_id", "auction_id"}),
        indexes = @Index(name = "idx_wishlist_user_created", columnList = "user_id, created_at")
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class WishList extends Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;
}

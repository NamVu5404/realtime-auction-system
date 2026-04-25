package com.namvu.realtimeauctionsystem.modules.wishlist.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishListRequest {

    @NotNull(message = "Auction ID is required")
    private Long auctionId;
}

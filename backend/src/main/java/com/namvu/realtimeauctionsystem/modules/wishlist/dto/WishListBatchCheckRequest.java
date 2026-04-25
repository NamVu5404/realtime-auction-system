package com.namvu.realtimeauctionsystem.modules.wishlist.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WishListBatchCheckRequest {

    @NotEmpty(message = "Auction IDs must not be empty")
    private List<Long> auctionIds;
}

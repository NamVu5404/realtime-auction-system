package com.namvu.realtimeauctionsystem.modules.auction.dto;

import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionResponse {
    private Long id;
    private String title;
    private String description;
    private String image; // primary image
    private BigDecimal startPrice;
    private BigDecimal currentPrice;
    private BigDecimal minStep;
    private AuctionStatus status;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal reservePrice;
    private Integer antiSnipeSeconds;
    private Integer extensionSeconds;

    // Seller info
    private UserResponse seller;

    // Highest bidder info
    private UserResponse highestBidder;

    private Instant createdAt;
    private String updatedBy;

    private List<FileResponse> images;
}

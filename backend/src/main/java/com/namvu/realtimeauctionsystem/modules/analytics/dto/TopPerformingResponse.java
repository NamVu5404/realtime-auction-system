package com.namvu.realtimeauctionsystem.modules.analytics.dto;

import com.namvu.realtimeauctionsystem.modules.bid.dto.MostActiveAuctionData;
import com.namvu.realtimeauctionsystem.modules.user.dto.TopSellerData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopPerformingResponse {
    private List<TopSellerData> topSellers;
    private List<MostActiveAuctionData> mostActiveAuctions;
}

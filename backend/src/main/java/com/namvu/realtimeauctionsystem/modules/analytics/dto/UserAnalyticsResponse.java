package com.namvu.realtimeauctionsystem.modules.analytics.dto;

import com.namvu.realtimeauctionsystem.modules.user.dto.CountryStatsData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAnalyticsResponse {
    private Long totalUsers;
    private Long newUsersThisMonth;
    private Long blockedUsers;
    private List<CountryStatsData> usersByCountry;
}

package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.request.BlockUserRequest;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.UserTrackingResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.enums.FraudType;
import org.springframework.data.domain.Pageable;

public interface UserTrackingService {
    void blockTracking(Long userId, BlockUserRequest request);

    void fraudTracking(Bid bid, Auction auction, FraudType type, String reason);

    PageResponse<UserTrackingResponse> getTrackingUser(Long userId, Pageable pageable);
}

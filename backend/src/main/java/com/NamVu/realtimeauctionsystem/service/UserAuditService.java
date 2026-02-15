package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.UserAuditResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.enums.FraudType;
import org.springframework.data.domain.Pageable;

public interface UserAuditService {
    void fraudAudit(Bid bid, Auction auction, FraudType type, String reason);

    PageResponse<UserAuditResponse> getUserAudit(Long userId, Pageable pageable);
}

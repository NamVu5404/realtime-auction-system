package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.user.UserAuditResponse;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.entity.Bid;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.FraudType;
import org.springframework.data.domain.Pageable;

public interface UserAuditService {
    void fraudAudit(Bid bid, Auction auction, FraudType type, String reason);

    void sellerRoleRevokedAudit(User user, String reason, String revokedBy);

    void sellerApprovedAudit(User user, String approvedBy);

    PageResponse<UserAuditResponse> getUserAudit(Long userId, Pageable pageable);

    PageResponse<UserAuditResponse> getMyAccountAudit(Pageable pageable);
}

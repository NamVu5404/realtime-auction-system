package com.namvu.realtimeauctionsystem.modules.user.service;

import com.namvu.realtimeauctionsystem.common.constant.FraudType;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserAuditResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.entity.UserAudit;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

public interface UserAuditService {
    void fraudAudit(Bid bid, Auction auction, FraudType type, String reason);

    void sellerRoleRevokedAudit(User user, String reason, String revokedBy);

    void sellerApprovedAudit(User user, String approvedBy);

    void sellerRejectedAudit(User user, String rejectedBy, String reason);

    void saveUserAudit(UserAudit audit);

    PageResponse<UserAuditResponse> getUserAudit(Long userId, Pageable pageable);

    PageResponse<UserAuditResponse> getMyAccountAudit(Pageable pageable);

    void banChatAudit(User user, Instant bannedUntil);

    void unbanChatAudit(User user);
}

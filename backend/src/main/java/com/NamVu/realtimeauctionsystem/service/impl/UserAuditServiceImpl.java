package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.user.UserAuditResponse;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.entity.Bid;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.entity.UserAudit;
import com.namvu.realtimeauctionsystem.enums.FraudType;
import com.namvu.realtimeauctionsystem.enums.UserActionType;
import com.namvu.realtimeauctionsystem.mapper.UserAuditMapper;
import com.namvu.realtimeauctionsystem.repository.UserAuditRepository;
import com.namvu.realtimeauctionsystem.service.UserAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAuditServiceImpl implements UserAuditService {

    private final UserAuditRepository auditRepository;
    private final UserAuditMapper auditMapper;

    @Override
    public void fraudAudit(Bid bid, Auction auction, FraudType type, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("user", bid.getBidder().getEmail());
        details.put("bidId", bid.getId());
        details.put("auctionId", auction.getId());
        details.put("fraudType", type);
        details.put("reason", reason);

        auditRepository.save(UserAudit.builder()
                .user(bid.getBidder())
                .actionType(UserActionType.FRAUD)
                .details(details)
                .build());
    }

    @Override
    public void sellerRoleRevokedAudit(User user, String reason, String revokedBy) {
        Map<String, Object> details = new HashMap<>();
        details.put("userId", user.getId());
        details.put("userEmail", user.getEmail());
        details.put("reason", reason != null ? reason : "No reason provided");
        details.put("revokedBy", revokedBy);

        auditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.SELLER_ROLE_REVOKED)
                .details(details)
                .build());
    }

    @Override
    public void sellerApprovedAudit(User user, String approvedBy) {
        Map<String, Object> details = new HashMap<>();
        details.put("userId", user.getId());
        details.put("userEmail", user.getEmail());
        details.put("approvedBy", approvedBy);

        auditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.SELLER_APPROVED)
                .details(details)
                .build());
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<UserAuditResponse> getUserAudit(Long userId, Pageable pageable) {
        Page<UserAudit> userAuditPage = auditRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<UserAuditResponse> data = userAuditPage.stream()
                .map(auditMapper::mapToResponse)
                .toList();

        return PageResponse.<UserAuditResponse>builder()
                .data(data)
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(userAuditPage.getTotalPages())
                .totalElements(userAuditPage.getTotalElements())
                .build();
    }
}

package com.namvu.realtimeauctionsystem.modules.user.service.impl;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.constant.FraudType;
import com.namvu.realtimeauctionsystem.common.constant.UserActionType;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Bid;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserAuditResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.entity.UserAudit;
import com.namvu.realtimeauctionsystem.modules.user.mapper.UserAuditMapper;
import com.namvu.realtimeauctionsystem.modules.user.repository.UserAuditRepository;
import com.namvu.realtimeauctionsystem.modules.user.service.UserAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAuditServiceImpl implements UserAuditService {

    private final UserAuditRepository userAuditRepository;
    private final UserAuditMapper userAuditMapper;

    private static final String REASON = "reason";
    private static final String USER_ID = "userId";
    private static final String USER_EMAIL = "userEmail";

    @Override
    public void fraudAudit(Bid bid, Auction auction, FraudType type, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("user", bid.getBidder().getEmail());
        details.put("bidId", bid.getId());
        details.put("auctionId", auction.getId());
        details.put("fraudType", type);
        details.put(REASON, reason);

        userAuditRepository.save(UserAudit.builder()
                .user(bid.getBidder())
                .actionType(UserActionType.FRAUD)
                .details(details)
                .build());
    }

    @Override
    public void sellerRoleRevokedAudit(User user, String reason, String revokedBy) {
        Map<String, Object> details = new HashMap<>();
        details.put(USER_ID, user.getId());
        details.put(USER_EMAIL, user.getEmail());
        details.put(REASON, reason != null ? reason : "No reason provided");
        details.put("revokedBy", revokedBy);

        userAuditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.SELLER_ROLE_REVOKED)
                .details(details)
                .build());
    }

    @Override
    public void sellerApprovedAudit(User user, String approvedBy) {
        Map<String, Object> details = new HashMap<>();
        details.put(USER_ID, user.getId());
        details.put(USER_EMAIL, user.getEmail());
        details.put("approvedBy", approvedBy);

        userAuditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.SELLER_APPROVED)
                .details(details)
                .build());
    }

    @Override
    public void sellerRejectedAudit(User user, String rejectedBy, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put(USER_ID, user.getId());
        details.put(USER_EMAIL, user.getEmail());
        details.put(REASON, reason != null ? reason : "No reason provided");
        details.put("rejectedBy", rejectedBy);

        userAuditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.SELLER_REJECTED)
                .details(details)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<UserAuditResponse> getUserAudit(Long userId, Pageable pageable) {
        return getAccountAudit(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserAuditResponse> getMyAccountAudit(Pageable pageable) {
        Long userId = SecurityUtils.getCurrentUserId();
        return getAccountAudit(userId, pageable);
    }

    private PageResponse<UserAuditResponse> getAccountAudit(Long userId, Pageable pageable) {
        Page<UserAudit> userAuditPage = userAuditRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<UserAuditResponse> data = userAuditPage.stream()
                .map(userAuditMapper::mapToResponse)
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

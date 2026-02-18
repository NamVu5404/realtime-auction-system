package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.common.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.user.UserAuditResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.UserAudit;
import com.NamVu.realtimeauctionsystem.enums.FraudType;
import com.NamVu.realtimeauctionsystem.enums.UserActionType;
import com.NamVu.realtimeauctionsystem.mapper.UserAuditMapper;
import com.NamVu.realtimeauctionsystem.repository.UserAuditRepository;
import com.NamVu.realtimeauctionsystem.service.UserAuditService;
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

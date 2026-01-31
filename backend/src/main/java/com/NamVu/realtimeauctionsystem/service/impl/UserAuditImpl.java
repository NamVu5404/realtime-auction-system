package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.request.BlockUserRequest;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.UserAuditResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.entity.UserAudit;
import com.NamVu.realtimeauctionsystem.enums.FraudType;
import com.NamVu.realtimeauctionsystem.enums.UserActionType;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.mapper.UserAuditMapper;
import com.NamVu.realtimeauctionsystem.repository.UserAuditRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.UserAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAuditImpl implements UserAuditService {

    private final UserAuditRepository auditRepository;
    private final UserRepository userRepository;
    private final UserAuditMapper auditMapper;

    @Override
    public void blockAudit(Long userId, BlockUserRequest request) {
        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String by = jwt.getSubject();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Map<String, Object> details = new HashMap<>();
        details.put("user", user.getEmail());
        details.put("by", by);
        details.put("reason", request.getReason());

        auditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(user.getStatus() == UserStatus.BLOCKED
                        ? UserActionType.BLOCKED
                        : UserActionType.UNBLOCKED)
                .details(details)
                .build());
    }

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
        Page<UserAudit> userTrackingPage = auditRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<UserAuditResponse> data = userTrackingPage.stream()
                .map(auditMapper::mapToResponse)
                .toList();

        return PageResponse.<UserAuditResponse>builder()
                .data(data)
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(userTrackingPage.getTotalPages())
                .totalElements(userTrackingPage.getTotalElements())
                .build();
    }
}

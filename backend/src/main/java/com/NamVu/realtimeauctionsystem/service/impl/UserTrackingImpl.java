package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.request.BlockUserRequest;
import com.NamVu.realtimeauctionsystem.dto.response.PageResponse;
import com.NamVu.realtimeauctionsystem.dto.response.UserTrackingResponse;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.entity.UserTracking;
import com.NamVu.realtimeauctionsystem.enums.FraudType;
import com.NamVu.realtimeauctionsystem.enums.UserActionType;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.mapper.UserTrackingMapper;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.repository.UserTrackingRepository;
import com.NamVu.realtimeauctionsystem.service.UserTrackingService;
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
public class UserTrackingImpl implements UserTrackingService {

    private final UserTrackingRepository trackingRepository;
    private final UserRepository userRepository;
    private final UserTrackingMapper mapper;

    @Override
    public void blockTracking(Long userId, BlockUserRequest request) {
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

        trackingRepository.save(UserTracking.builder()
                .user(user)
                .actionType(user.getStatus() == UserStatus.BLOCKED
                        ? UserActionType.BLOCKED
                        : UserActionType.UNBLOCKED)
                .details(details)
                .build());
    }

    @Override
    public void fraudTracking(Bid bid, Auction auction, FraudType type, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("user", bid.getBidder().getEmail());
        details.put("bidId", bid.getId());
        details.put("auctionId", auction.getId());
        details.put("fraudType", type);
        details.put("reason", reason);

        trackingRepository.save(UserTracking.builder()
                .user(bid.getBidder())
                .actionType(UserActionType.FRAUD)
                .details(details)
                .build());
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<UserTrackingResponse> getTrackingUser(Long userId, Pageable pageable) {
        Page<UserTracking> userTrackingPage = trackingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<UserTrackingResponse> data = userTrackingPage.stream()
                .map(mapper::mapToResponse)
                .toList();

        return PageResponse.<UserTrackingResponse>builder()
                .data(data)
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(userTrackingPage.getTotalPages())
                .totalElements(userTrackingPage.getTotalElements())
                .build();
    }
}

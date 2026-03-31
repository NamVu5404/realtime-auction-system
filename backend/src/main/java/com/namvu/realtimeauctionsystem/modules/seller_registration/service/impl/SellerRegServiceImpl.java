package com.namvu.realtimeauctionsystem.modules.seller_registration.service.impl;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.enums.RequestStatus;
import com.namvu.realtimeauctionsystem.common.enums.Role;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.seller_registration.dto.SellerRegResponse;
import com.namvu.realtimeauctionsystem.modules.seller_registration.entity.SellerRegistration;
import com.namvu.realtimeauctionsystem.modules.seller_registration.repository.SellerRegRepository;
import com.namvu.realtimeauctionsystem.modules.seller_registration.service.SellerRegService;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.mapper.UserMapper;
import com.namvu.realtimeauctionsystem.modules.user.service.UserAuditService;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SellerRegServiceImpl implements SellerRegService {

    private final SellerRegRepository sellerRegRepository;
    private final UserService userService;
    private final UserMapper userMapper;
    private final UserAuditService userAuditService;
    private final AuctionService auctionService;

    @Override
    @PreAuthorize("!hasAuthority('SELLER')")
    public SellerRegResponse registerSeller() {
        Long userId = SecurityUtils.getCurrentUserId();

        if (sellerRegRepository.existsByUser_IdAndStatus(userId, RequestStatus.PENDING)) {
            throw new AppException(ErrorCode.SELLER_REGISTRATION_PENDING);
        }

        User user = userService.getActiveUserById(userId);

        SellerRegistration res = sellerRegRepository.save(
                SellerRegistration.builder()
                        .user(user)
                        .build()
        );

        return SellerRegResponse.builder()
                .id(res.getId())
                .user(userMapper.mapToResponse(user))
                .status(res.getStatus())
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public SellerRegResponse approveSeller(Long registrationId) {
        SellerRegistration registration = sellerRegRepository.findById(registrationId)
                .orElseThrow(() -> new AppException(ErrorCode.SELLER_REGISTRATION_NOT_FOUND));

        User user = registration.getUser();
        user.getRoles().add(Role.SELLER);
        userService.saveUser(user);

        registration.setStatus(RequestStatus.APPROVED);
        registration.setApprovedAt(Instant.now());
        registration = sellerRegRepository.save(registration);

        // Save audit log
        userAuditService.sellerApprovedAudit(user, SecurityUtils.getCurrentUserEmail());

        return SellerRegResponse.builder()
                .id(registration.getId())
                .user(userMapper.mapToResponse(user))
                .status(registration.getStatus())
                .approvedAt(registration.getApprovedAt())
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public SellerRegResponse rejectSeller(Long registrationId, String reason) {
        SellerRegistration registration = sellerRegRepository.findById(registrationId)
                .orElseThrow(() -> new AppException(ErrorCode.SELLER_REGISTRATION_NOT_FOUND));

        registration.setStatus(RequestStatus.REJECTED);
        registration.setRejectReason(reason);
        registration = sellerRegRepository.save(registration);

        // Save audit log
        userAuditService.sellerRejectedAudit(registration.getUser(), SecurityUtils.getCurrentUserEmail(), reason);

        return SellerRegResponse.builder()
                .id(registration.getId())
                .user(userMapper.mapToResponse(registration.getUser()))
                .status(registration.getStatus())
                .rejectReason(registration.getRejectReason())
                .build();
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<SellerRegResponse> getRegistrations(Pageable pageable) {
        Page<SellerRegistration> page = sellerRegRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<SellerRegResponse> list = page.getContent().stream()
                .map(reg -> SellerRegResponse.builder()
                        .id(reg.getId())
                        .user(userMapper.mapToResponse(reg.getUser()))
                        .status(reg.getStatus())
                        .approvedAt(reg.getApprovedAt())
                        .rejectReason(reg.getRejectReason())
                        .createdAt(reg.getCreatedAt())
                        .build())
                .toList();

        return PageResponse.<SellerRegResponse>builder()
                .currentPage(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPage(page.getTotalPages())
                .data(list)
                .build();
    }

    @Override
    public SellerRegResponse getMyRegistration() {
        Long userId = SecurityUtils.getCurrentUserId();
        return sellerRegRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .map(reg -> SellerRegResponse.builder()
                        .id(reg.getId())
                        .user(userMapper.mapToResponse(reg.getUser()))
                        .status(reg.getStatus())
                        .approvedAt(reg.getApprovedAt())
                        .rejectReason(reg.getRejectReason())
                        .build())
                .orElse(null);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public UserResponse revokeSellerRole(Long userId, String reason) {
        User user = userService.getActiveUserById(userId);

        if (user.getRoles().contains(Role.ADMIN)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
        }

        if (user.getRoles().contains(Role.SELLER)) {
            user.getRoles().remove(Role.SELLER);
            user = userService.saveUser(user);

            // Cancel DRAFT and SCHEDULED auctions
            auctionService.cancelFutureAuctions(userId);

            // Save audit log
            String revokedBy = SecurityUtils.getCurrentUserEmail();
            userAuditService.sellerRoleRevokedAudit(user, reason, revokedBy);

            log.info("Admin {} revoked SELLER role for user {}. Reason: {}. Future auctions cancelled.",
                    revokedBy, userId, reason);
        }

        return userMapper.mapToResponse(user);
    }
}

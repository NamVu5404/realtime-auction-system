package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.dto.seller.SellerRegResponse;
import com.namvu.realtimeauctionsystem.dto.user.UserResponse;
import org.springframework.data.domain.Pageable;

public interface SellerRegService {
    SellerRegResponse registerSeller();

    SellerRegResponse approveSeller(Long registrationId);

    SellerRegResponse rejectSeller(Long registrationId, String reason);

    PageResponse<SellerRegResponse> getRegistrations(Pageable pageable);

    SellerRegResponse getMyRegistration();

    UserResponse revokeSellerRole(Long userId, String reason);
}

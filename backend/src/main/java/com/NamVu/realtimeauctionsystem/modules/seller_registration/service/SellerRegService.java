package com.namvu.realtimeauctionsystem.modules.seller_registration.service;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.seller_registration.dto.SellerRegResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import org.springframework.data.domain.Pageable;

public interface SellerRegService {
    SellerRegResponse registerSeller();

    SellerRegResponse approveSeller(Long registrationId);

    SellerRegResponse rejectSeller(Long registrationId, String reason);

    PageResponse<SellerRegResponse> getRegistrations(Pageable pageable);

    SellerRegResponse getMyRegistration();

    UserResponse revokeSellerRole(Long userId, String reason);
}

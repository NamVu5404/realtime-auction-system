package com.namvu.realtimeauctionsystem.modules.seller_registration.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.seller_registration.dto.SellerRegResponse;
import com.namvu.realtimeauctionsystem.modules.seller_registration.service.SellerRegService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/sellers")
@RequiredArgsConstructor
public class SellerRegController {

    private final SellerRegService sellerRegService;

    @GetMapping("/registrations")
    public ApiResponse<PageResponse<SellerRegResponse>> getRegistrations(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(sellerRegService.getRegistrations(pageable));
    }

    @PostMapping("/registration")
    public ApiResponse<SellerRegResponse> registerSeller() {
        return ApiResponse.of(SELLER_REG_SUBMITTED, sellerRegService.registerSeller());
    }

    @GetMapping("/my-registration")
    public ApiResponse<SellerRegResponse> getMyRegistration() {
        return ApiResponse.ok(sellerRegService.getMyRegistration());
    }

    @PatchMapping("/{registrationId}/approve")
    public ApiResponse<SellerRegResponse> approveSeller(@PathVariable Long registrationId) {
        return ApiResponse.of(SELLER_REG_APPROVED, sellerRegService.approveSeller(registrationId));
    }

    @PatchMapping("/{registrationId}/reject")
    public ApiResponse<SellerRegResponse> rejectSeller(@PathVariable Long registrationId, @RequestParam(required = false) String reason) {
        return ApiResponse.of(SELLER_REG_REJECTED, sellerRegService.rejectSeller(registrationId, reason));
    }

    @PatchMapping("/users/{userId}/revoke-role")
    public ApiResponse<UserResponse> revokeSellerRole(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {
        return ApiResponse.of(SELLER_ROLE_REVOKED, sellerRegService.revokeSellerRole(userId, reason));
    }
}

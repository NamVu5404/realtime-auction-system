package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.dto.seller.SellerRegResponse;
import com.namvu.realtimeauctionsystem.service.SellerRegService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.namvu.realtimeauctionsystem.dto.user.UserResponse;

import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
        return ApiResponse.<PageResponse<SellerRegResponse>>builder()
                .result(sellerRegService.getRegistrations(pageable))
                .build();
    }

    @PostMapping("/registration")
    public ApiResponse<SellerRegResponse> registerSeller() {
        return ApiResponse.<SellerRegResponse>builder()
                .result(sellerRegService.registerSeller())
                .build();
    }

    @GetMapping("/my-registration")
    public ApiResponse<SellerRegResponse> getMyRegistration() {
        return ApiResponse.<SellerRegResponse>builder()
                .result(sellerRegService.getMyRegistration())
                .build();
    }

    @PatchMapping("/{registrationId}/approve")
    public ApiResponse<SellerRegResponse> approveSeller(@PathVariable Long registrationId) {
        return ApiResponse.<SellerRegResponse>builder()
                .result(sellerRegService.approveSeller(registrationId))
                .build();
    }

    @PatchMapping("/{registrationId}/reject")
    public ApiResponse<SellerRegResponse> rejectSeller(@PathVariable Long registrationId, @RequestParam(required = false) String reason) {
        return ApiResponse.<SellerRegResponse>builder()
                .result(sellerRegService.rejectSeller(registrationId, reason))
                .build();
    }

    @PatchMapping("/users/{userId}/revoke-role")
    public ApiResponse<UserResponse> revokeSellerRole(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {
        return ApiResponse.<UserResponse>builder()
                .result(sellerRegService.revokeSellerRole(userId, reason))
                .build();
    }
}

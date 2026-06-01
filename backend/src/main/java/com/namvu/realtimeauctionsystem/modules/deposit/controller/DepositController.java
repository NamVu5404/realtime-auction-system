package com.namvu.realtimeauctionsystem.modules.deposit.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.deposit.dto.DepositStatusResponse;
import com.namvu.realtimeauctionsystem.modules.deposit.service.DepositService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/deposits")
@RequiredArgsConstructor
public class DepositController {

    private final DepositService depositService;

    @PostMapping("/auctions/{auctionId}")
    public ApiResponse<DepositStatusResponse> placeDeposit(@PathVariable Long auctionId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.of(DEPOSIT_PLACED, depositService.placeDeposit(auctionId, userId));
    }

    @GetMapping("/auctions/{auctionId}/status")
    public ApiResponse<DepositStatusResponse> getDepositStatus(@PathVariable Long auctionId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.of(DEPOSIT_STATUS_FETCHED, depositService.getDepositStatus(auctionId, userId));
    }

    @GetMapping("/me")
    public ApiResponse<List<DepositStatusResponse>> getMyDeposits() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.of(DEPOSIT_LIST_FETCHED, depositService.getMyDeposits(userId));
    }
}

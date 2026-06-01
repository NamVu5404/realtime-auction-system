package com.namvu.realtimeauctionsystem.modules.wallet.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.wallet.dto.WalletResponse;
import com.namvu.realtimeauctionsystem.modules.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.WALLET_FETCHED;

@RestController
@RequestMapping("/v1/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    public ApiResponse<WalletResponse> getMyWallet() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.of(WALLET_FETCHED, walletService.getWalletInfo(userId));
    }
}

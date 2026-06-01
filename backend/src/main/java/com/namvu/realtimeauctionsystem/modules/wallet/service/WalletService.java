package com.namvu.realtimeauctionsystem.modules.wallet.service;

import com.namvu.realtimeauctionsystem.modules.wallet.dto.WalletResponse;
import com.namvu.realtimeauctionsystem.modules.wallet.entity.Wallet;

import java.math.BigDecimal;

public interface WalletService {

    Wallet getOrCreateWallet(Long userId);

    /** Chuyển tiền từ available → locked. Ném INSUFFICIENT_BALANCE nếu không đủ. */
    void lockFunds(Long userId, BigDecimal amount);

    /** Chuyển tiền từ locked → available (hoàn cọc cho người thua). */
    void releaseFunds(Long userId, BigDecimal amount);

    /** Chuyển tiền từ locked → out (winner không trả — bị trừ). */
    void deductLockedFunds(Long userId, BigDecimal amount);

    /** Cộng tiền vào available (winner seller nhận, top-up). */
    void creditFunds(Long userId, BigDecimal amount);

    BigDecimal getAvailableBalance(Long userId);

    WalletResponse getWalletInfo(Long userId);
}
